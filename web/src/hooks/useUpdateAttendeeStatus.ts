import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { useNotifyAttendee } from "./useNotifyAttendee";
import { useNotistack } from "./useNotistack";

export type UpdateAttendeeStatusPayload = {
  meetId: string;
  attendeeId: string;
  status: string;
  sendMessage?: boolean;
  subject?: string;
  text?: string;
};

export function useUpdateAttendeeStatus() {
  const api = useApi();
  const { error } = useNotistack();
  const { notifyAttendeeAsync } = useNotifyAttendee();

  const mutation = useMutation<unknown, Error, UpdateAttendeeStatusPayload>({
    mutationFn: async ({ meetId, attendeeId, status, sendMessage, subject, text }) => {
      if (sendMessage) {
        const res = await notifyAttendeeAsync({
          meetId,
          subject: subject?.trim() || "",
          text: text ?? "",
          attendeeIds: [attendeeId],
        });
        if (!res) {
          throw new Error("Failed to send notification to attendee");
        }
      }
      return api.patch(`/meets/${meetId}/attendees/${attendeeId}`, { status });
    },
    onError: (err) => {
      error(`Failed to update attendee status: ${err.message}`);
    },
  });

  return {
    updateAttendeeStatus: mutation.mutate,
    updateAttendeeStatusAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
