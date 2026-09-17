import { attendeeMessageQueryKeys } from "./attendeeMessageQueryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import type { AttendeeMessage } from "./useFetchAttendeeMessages";
import type { Attendee } from "../types/AttendeeModel";

type MarkMessageReadPayload = {
  meetId: string;
  messageId: string;
  attendeeId?: string | null;
};

type MeetAttendeesQueryData = {
  attendees: Attendee[];
  source?: "cache" | "network";
};

type MarkMessageReadContext = {
  messageQueryKey: ReturnType<typeof attendeeMessageQueryKeys.attendee>;
  previousMessages?: AttendeeMessage[];
  previousAttendeeQueries: Array<
    [readonly unknown[], MeetAttendeesQueryData | undefined]
  >;
};

export function useMarkAttendeeMessageRead() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    unknown,
    Error,
    MarkMessageReadPayload,
    MarkMessageReadContext
  >({
    mutationFn: async ({ meetId, messageId }) => {
      return api.patch(`/meets/${meetId}/messages/${messageId}/read`, {});
    },
    onMutate: async (variables) => {
      const messageQueryKey = attendeeMessageQueryKeys.attendee(
        variables.meetId,
        variables.attendeeId,
      );
      const attendeeQueryKey = ["meet-attendees", variables.meetId] as const;
      await Promise.all([
        queryClient.cancelQueries({ queryKey: messageQueryKey }),
        queryClient.cancelQueries({ queryKey: attendeeQueryKey }),
      ]);

      const previousMessages =
        queryClient.getQueryData<AttendeeMessage[]>(messageQueryKey);
      const previousAttendeeQueries =
        queryClient.getQueriesData<MeetAttendeesQueryData>({
          queryKey: attendeeQueryKey,
        });
      const updatedMessages = previousMessages?.map((message) =>
        message.id === variables.messageId
          ? { ...message, isRead: true }
          : message,
      );

      if (updatedMessages) {
        queryClient.setQueryData(messageQueryKey, updatedMessages);
        const hasUnreadMessages = updatedMessages.some(
          (message) => message.isRead === false,
        );
        queryClient.setQueriesData<MeetAttendeesQueryData>(
          { queryKey: attendeeQueryKey },
          (current) => {
            if (!current?.attendees || !variables.attendeeId) return current;
            return {
              ...current,
              attendees: current.attendees.map((attendee) =>
                attendee.id === variables.attendeeId
                  ? { ...attendee, hasUnreadMessages }
                  : attendee,
              ),
            };
          },
        );
      }

      return {
        messageQueryKey,
        previousMessages,
        previousAttendeeQueries,
      };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(
        context.messageQueryKey,
        context.previousMessages,
      );
      context.previousAttendeeQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendeeMessageQueryKeys.attendee(
          variables.meetId,
          variables.attendeeId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: ["meet-attendees", variables.meetId],
      });
    },
  });

  return {
    markRead: mutation.mutate,
    markReadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
