import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type CheckinPayload = {
  meetId: string;
  attendeeIds: string[];
  status?: string;
};

export function useCheckinAttendees() {
  const api = useApi();

  const mutation = useMutation<unknown, Error, CheckinPayload>({
    mutationFn: async ({ meetId, attendeeIds, status = "checked-in" }) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      await Promise.all(
        attendeeIds.map((attendeeId) =>
          api.patch(`/meets/${meetId}/attendees/${attendeeId}`, {
            status
          })
        )
      );
    }
  });

  return {
    checkinAttendees: mutation.mutate,
    checkinAttendeesAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error
  };
}
