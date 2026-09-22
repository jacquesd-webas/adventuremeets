import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type ConfirmAttendeePayload = {
  meetCode: string;
  attendeeId: string;
};

type ConfirmAttendeeResponse = {
  attendee: {
    id: string;
    status?: string | null;
  };
  hasMissingFields?: boolean;
};

type DeclineAttendeePayload = {
  meetCode: string;
  attendeeId: string;
};

export function useAttendeeRsvp() {
  const api = useApi();
  const queryClient = useQueryClient();

  const invalidateQueries = (meetCode: string, attendeeId: string) => {
    queryClient.invalidateQueries({
      queryKey: ["attendee-status", attendeeId],
    });
    queryClient.invalidateQueries({
      queryKey: ["attendee-edit", meetCode, attendeeId],
    });
  };

  const confirmMutation = useMutation<
    ConfirmAttendeeResponse,
    Error,
    ConfirmAttendeePayload
  >({
    mutationFn: async ({ meetCode, attendeeId }) => {
      return api.patch<ConfirmAttendeeResponse>(
        `/meets/${meetCode}/attendee/${attendeeId}`,
        { status: "confirmed" },
      );
    },
    onSuccess: (_data, variables) => {
      invalidateQueries(variables.meetCode, variables.attendeeId);
    },
  });

  const declineMutation = useMutation<unknown, Error, DeclineAttendeePayload>({
    mutationFn: async ({ meetCode, attendeeId }) => {
      return api.patch(`/meets/${meetCode}/attendee/${attendeeId}`, {
        status: "cancelled",
      });
    },
    onSuccess: (_data, variables) => {
      invalidateQueries(variables.meetCode, variables.attendeeId);
    },
  });

  return {
    confirmAttendeeAsync: confirmMutation.mutateAsync,
    declineAttendeeAsync: declineMutation.mutateAsync,
    isLoading: confirmMutation.isPending || declineMutation.isPending,
    error:
      confirmMutation.error?.message || declineMutation.error?.message || null,
  };
}
