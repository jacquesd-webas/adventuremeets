import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { setCachedMeetAttendees } from "../helpers/checkinOfflineStore";

type UpdateMeetAttendeePayload = {
  meetId: string;
  attendeeId: string;
  status?: string;
  paidFullAt?: string | null;
  paidDepositAt?: string | null;
  guests?: number;
};

export function useUpdateMeetAttendee() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, UpdateMeetAttendeePayload>({
    mutationFn: async ({
      meetId,
      attendeeId,
      status,
      paidFullAt,
      paidDepositAt,
      guests,
    }) => {
      const payload = { status, paidFullAt, paidDepositAt, guests };
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );
      return api.patch(`/meets/${meetId}/attendees/${attendeeId}`, payload);
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueriesData(
        { queryKey: ["meet-attendees", variables.meetId] },
        (current: any) => {
          if (!current?.attendees) return current;
          return {
            ...current,
            attendees: current.attendees.map((attendee: any) =>
              attendee.id !== variables.attendeeId
                ? attendee
                : {
                    ...attendee,
                    ...(variables.status !== undefined
                      ? { status: variables.status }
                      : {}),
                    ...(variables.paidFullAt !== undefined
                      ? { paidFullAt: variables.paidFullAt }
                      : {}),
                    ...(variables.paidDepositAt !== undefined
                      ? { paidDepositAt: variables.paidDepositAt }
                      : {}),
                    ...(variables.guests !== undefined
                      ? { guests: variables.guests }
                      : {}),
                  },
            ),
          };
        },
      );
      const allAttendees = queryClient.getQueryData<any>([
        "meet-attendees",
        variables.meetId,
        "all",
      ]);
      const acceptedAttendees = queryClient.getQueryData<any>([
        "meet-attendees",
        variables.meetId,
        "accepted",
      ]);
      if (allAttendees?.attendees) {
        setCachedMeetAttendees(variables.meetId, "all", allAttendees.attendees);
      }
      if (acceptedAttendees?.attendees) {
        setCachedMeetAttendees(
          variables.meetId,
          "accepted",
          acceptedAttendees.attendees,
        );
      }
      queryClient.invalidateQueries({
        queryKey: ["meet-attendees", variables.meetId],
      });
    },
  });

  return {
    updateMeetAttendee: mutation.mutate,
    updateMeetAttendeeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
