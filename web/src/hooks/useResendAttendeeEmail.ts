import { useMutation, useQueryClient } from "@tanstack/react-query";
import { attendeeMessageQueryKeys } from "./attendeeMessageQueryKeys";
import { useApi } from "./useApi";

type ResendAttendeeEmailPayload = {
  meetId: string;
  attendeeId: string;
  messageId: string;
};

export function useResendAttendeeEmail() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, ResendAttendeeEmailPayload>({
    mutationFn: ({ meetId, attendeeId, messageId }) =>
      api.post(
        `/meets/${meetId}/attendees/${attendeeId}/messages/${messageId}/resend`,
        {},
      ),
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
    resend: mutation.mutate,
    isLoading: mutation.isPending,
  };
}
