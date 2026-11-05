import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type AdminCheckinAttendee = {
  id: string;
  name: string;
  status: string;
};

type AdminCheckinResponse = {
  meetName: string;
  attendees: AdminCheckinAttendee[];
};

const adminCheckinKey = (meetId?: string, code?: string) => [
  "admin-checkin",
  meetId,
  code,
];

export function useAdminMeetCheckin(meetId?: string, code?: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: adminCheckinKey(meetId, code),
    enabled: Boolean(meetId && code),
    queryFn: () =>
      api.get<AdminCheckinResponse>(
        `/meets/${meetId}/admin-checkin?adminShareCode=${encodeURIComponent(code || "")}`,
      ),
  });
  const mutation = useMutation({
    mutationFn: (attendeeId: string) =>
      api.post<AdminCheckinAttendee>(`/meets/${meetId}/admin-checkin`, {
        attendeeId,
        adminShareCode: code,
      }),
    onSuccess: (attendee) => {
      queryClient.setQueryData<AdminCheckinResponse>(
        adminCheckinKey(meetId, code),
        (current) =>
          current
            ? {
                ...current,
                attendees: current.attendees.map((item) =>
                  item.id === attendee.id ? attendee : item,
                ),
              }
            : current,
      );
      void queryClient.invalidateQueries({
        queryKey: adminCheckinKey(meetId, code),
      });
    },
  });
  return { query, mutation };
}
