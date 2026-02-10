import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { useNotistack } from "./useNotistack";

type ConfirmAttendeeEmailPayload = {
  email: string;
};

type ConfirmAttendeeEmailResponse = {
  valid: boolean;
};

export function useConfirmAttendeeEmail(meetId?: string, attendeeId?: string) {
  const api = useApi();
  const { error } = useNotistack();

  const mutation = useMutation<
    ConfirmAttendeeEmailResponse,
    Error,
    ConfirmAttendeeEmailPayload
  >({
    mutationFn: async ({ email }) => {
      return api.post<ConfirmAttendeeEmailResponse>(
        `/meets/${meetId}/attendees/${attendeeId}/verify-email`,
        { email },
      );
    },
    onError: (err) => {
      error(`Unable to verify email: ${err.message}`);
    },
  });

  return {
    confirmAttendeeEmail: mutation.mutate,
    confirmAttendeeEmailAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
    data: mutation.data ?? null,
  };
}
