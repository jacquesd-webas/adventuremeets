import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type WhatsappChat = { id: string; name: string; isGroup: boolean };

export const meetWhatsappQueryKeys = {
  chats: (meetId: string) => ["meets", meetId, "whatsapp", "chats"] as const,
};

export function useMeetWhatsappChats(meetId: string) {
  const api = useApi();
  return useQuery({
    queryKey: meetWhatsappQueryKeys.chats(meetId),
    queryFn: () => api.get<WhatsappChat[]>(`/meets/${meetId}/whatsapp/chats`),
    retry: false,
  });
}

export function useSendMeetWhatsapp(meetId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      chatId: string;
      message: string;
      includeImage: boolean;
    }) => api.post<{ sent: true }>(`/meets/${meetId}/whatsapp/send`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: meetWhatsappQueryKeys.chats(meetId),
      });
    },
  });
}
