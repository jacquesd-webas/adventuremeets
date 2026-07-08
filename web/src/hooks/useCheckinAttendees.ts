import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import AttendeeStatusEnum from "../types/AttendeeStatusEnum";
import {
  acknowledgeCheckinQueueEntry,
  listCheckinQueue,
  markCheckinQueueEntryFailed,
  type CheckinQueueEntry,
  upsertCheckinQueueEntry,
} from "../helpers/checkinOfflineStore";

type CheckinPayload = {
  meetId: string;
  attendeeIds: string[];
  status?: string;
};

export function useCheckinAttendees(meetId?: string | null) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [queueEntries, setQueueEntries] = useState<CheckinQueueEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  const refreshQueue = useCallback(() => {
    setQueueEntries(listCheckinQueue(meetId));
  }, [meetId]);

  const flushQueue = useCallback(async () => {
    if (!meetId) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
      return;
    }

    const pendingEntries = listCheckinQueue(meetId)
      .filter((entry) => !entry.failedAt)
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

    if (!pendingEntries.length) {
      refreshQueue();
      return;
    }

    setIsSyncing(true);
    setIsOffline(false);
    let flushedAny = false;
    try {
      for (const entry of pendingEntries) {
        try {
          await api.patch(`/meets/${entry.meetId}/attendees/${entry.attendeeId}`, {
            status: entry.status,
          });
          acknowledgeCheckinQueueEntry(entry);
          flushedAny = true;
        } catch (error: any) {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            setIsOffline(true);
            break;
          }
          const statusCode = Number(error?.status);
          if (Number.isFinite(statusCode) && statusCode >= 400 && statusCode < 500) {
            markCheckinQueueEntryFailed(
              entry,
              error?.message || "Unable to sync this change",
            );
            continue;
          }
          break;
        }
      }
    } finally {
      refreshQueue();
      setIsSyncing(false);
      if (flushedAny) {
        await queryClient.invalidateQueries({
          queryKey: ["meet-attendees", meetId],
        });
      }
    }
  }, [api, meetId, queryClient, refreshQueue]);

  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      void flushQueue();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void flushQueue();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [flushQueue]);

  useEffect(() => {
    void flushQueue();
  }, [flushQueue]);

  const mutation = useMutation<unknown, Error, CheckinPayload>({
    mutationFn: async ({
      meetId,
      attendeeIds,
      status = AttendeeStatusEnum.CheckedIn,
    }) => {
      attendeeIds.forEach((attendeeId, index) => {
        upsertCheckinQueueEntry({
          meetId,
          attendeeId,
          status,
          updatedAt: new Date(Date.now() + index).toISOString(),
        });
      });
      refreshQueue();
      void flushQueue();
    },
  });

  const queuedStatusByAttendeeId = useMemo(() => {
    return queueEntries
      .filter((entry) => !entry.failedAt)
      .reduce<Record<string, string>>((acc, entry) => {
        acc[entry.attendeeId] = entry.status;
        return acc;
      }, {});
  }, [queueEntries]);

  const failedStatusByAttendeeId = useMemo(() => {
    return queueEntries
      .filter((entry) => entry.failedAt)
      .reduce<Record<string, string>>((acc, entry) => {
        acc[entry.attendeeId] = entry.lastError || "Unable to sync";
        return acc;
      }, {});
  }, [queueEntries]);

  return {
    checkinAttendees: mutation.mutate,
    checkinAttendeesAsync: mutation.mutateAsync,
    isLoading: mutation.isPending || isSyncing,
    isSyncing,
    isOffline,
    pendingCount: queueEntries.filter((entry) => !entry.failedAt).length,
    failedCount: queueEntries.filter((entry) => Boolean(entry.failedAt)).length,
    queuedStatusByAttendeeId,
    failedStatusByAttendeeId,
    error: mutation.error,
  };
}
