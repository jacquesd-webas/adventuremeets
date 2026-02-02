import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { useNotistack } from "./useNotistack";

export type NotifyAttendeePayload = {
  meetId: string;
  subject: string;
  text: string;
  attendeeIds?: string[];
};

export function useNotifyAttendee() {
  const api = useApi();
  const { error } = useNotistack();

  const mutation = useMutation<unknown, Error, NotifyAttendeePayload>({
    mutationFn: async ({ meetId, attendeeIds, ...payload }) => {
      return api.post(`/meets/${meetId}/message`, {
        ...payload,
        attendeeIds: attendeeIds?.length ? attendeeIds : undefined,
      });
    },
    onError: (err) => {
      error(`Failed to notify attendee: ${err.message}`);
    },
  });

  return {
    notifyAttendee: mutation.mutate,
    notifyAttendeeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
