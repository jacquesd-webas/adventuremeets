import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

export const attendeeTagQueryKeys = {
  meet: (meetId: string) => ["meets", meetId, "attendee-tags"] as const,
  attendee: (meetId: string, attendeeId: string) =>
    ["meets", meetId, "attendees", attendeeId, "tags"] as const,
};

type TagsResponse = { tags: string[] };
export type AttendeeNotesAndTags = { notes: string; tags: string[] };

export function useMeetAttendeeTags(meetId: string, enabled: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: attendeeTagQueryKeys.meet(meetId),
    enabled: Boolean(meetId && enabled),
    queryFn: () => api.get<TagsResponse>(`/meets/${meetId}/tags`),
  });
}

export function useAttendeeTags(
  meetId: string,
  attendeeId: string,
  enabled: boolean,
) {
  const api = useApi();
  return useQuery({
    queryKey: attendeeTagQueryKeys.attendee(meetId, attendeeId),
    enabled: Boolean(meetId && attendeeId && enabled),
    queryFn: () =>
      api.get<AttendeeNotesAndTags>(
        `/meets/${meetId}/attendees/${attendeeId}/tags`,
      ),
  });
}

export function useSaveAttendeeNotesAndTags(
  meetId: string,
  attendeeId: string,
) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: AttendeeNotesAndTags) =>
      api.put<AttendeeNotesAndTags>(
        `/meets/${meetId}/attendees/${attendeeId}/tags`,
        value,
      ),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        attendeeTagQueryKeys.attendee(meetId, attendeeId),
        saved,
      );
      queryClient.invalidateQueries({
        queryKey: attendeeTagQueryKeys.attendee(meetId, attendeeId),
      });
      queryClient.invalidateQueries({
        queryKey: attendeeTagQueryKeys.meet(meetId),
      });
      queryClient.invalidateQueries({ queryKey: ["meet-attendees", meetId] });
    },
  });
}
