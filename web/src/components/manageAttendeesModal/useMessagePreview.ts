import { useMutation } from "@tanstack/react-query";
import { useApi } from "../../hooks/useApi";

export type MessagePreviewRequest = {
  meetId: string;
  messages: Array<{
    attendeeIds: string[];
    subject: string;
    text: string;
    includeStatusUrl: boolean;
    sendAsGroup: boolean;
  }>;
};

export type MessagePreviewResponse = {
  previews: Array<{
    from: string;
    to: string;
    subject: string;
    attendeeName: string;
    html: string;
  }>;
};

export function useMessagePreview() {
  const api = useApi();

  return useMutation<MessagePreviewResponse, Error, MessagePreviewRequest>({
    mutationFn: ({ meetId, messages }) =>
      api.post(`/meets/${meetId}/message/preview`, { messages }),
  });
}
