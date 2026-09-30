import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { useNotistack } from "./useNotistack";

type ResendIndemnityConfirmationPayload = {
  meetId: string;
  attendeeId: string;
};

export function useResendIndemnityConfirmation() {
  const api = useApi();
  const queryClient = useQueryClient();
  const notice = useNotistack();

  const mutation = useMutation({
    mutationFn: ({ meetId, attendeeId }: ResendIndemnityConfirmationPayload) =>
      api.post(`/meets/${meetId}/attendees/${attendeeId}/resend-indemnity`, {}),
    onSuccess: (_data, variables) => {
      notice.success("Indemnity confirmation email sent");
      queryClient.invalidateQueries({
        queryKey: ["meet-attendees", variables.meetId],
      });
    },
    onError: (error: Error) => {
      notice.error(`Failed to resend indemnity: ${error.message}`);
    },
  });

  return {
    resendIndemnityConfirmationAsync: mutation.mutateAsync,
    isResendingIndemnity: mutation.isPending,
  };
}
