import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

export const signedIndemnityPdfKey = (meetId: string, attendeeId: string) =>
  ["meet", meetId, "attendees", attendeeId, "signed-indemnity"] as const;

export function useSignedIndemnityPdf(
  meetId: string,
  attendeeId: string,
  enabled: boolean,
) {
  const api = useApi();
  return useQuery({
    queryKey: signedIndemnityPdfKey(meetId, attendeeId),
    queryFn: () =>
      api.getBlob(`/meets/${meetId}/attendees/${attendeeId}/signed-indemnity`),
    enabled,
  });
}
