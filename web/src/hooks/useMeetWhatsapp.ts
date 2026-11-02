import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type WhatsappChat = { id: string; name: string; isGroup: boolean };

export const meetWhatsappQueryKeys = {
  chats: (meetId: string) => ["meets", meetId, "whatsapp", "chats"] as const,
  connection: (meetId: string) =>
    ["meets", meetId, "whatsapp", "connection"] as const,
  invite: (meetId: string) => ["meets", meetId, "whatsapp", "invite"] as const,
};

export function useMeetWhatsappInviteLink(meetId?: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: meetWhatsappQueryKeys.invite(meetId ?? ""),
    enabled: Boolean(meetId),
    queryFn: () =>
      api.get<{ url: string }>(`/meets/${meetId}/whatsapp/group/invite`),
    retry: false,
  });
}

export function useMeetWhatsappConnection(meetId?: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: meetWhatsappQueryKeys.connection(meetId ?? ""),
    enabled: Boolean(meetId),
    queryFn: () =>
      api.get<{ connected: boolean }>(`/meets/${meetId}/whatsapp/connection`),
    retry: false,
  });
}

export function useCreateMeetWhatsappGroup() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetId: string) =>
      api.post<{ chatId: string; organizerAdded: boolean }>(
        `/meets/${meetId}/whatsapp/group`,
        {},
      ),
    onSuccess: (_group, meetId) => {
      queryClient.invalidateQueries({ queryKey: ["meet", meetId] });
      queryClient.invalidateQueries({ queryKey: ["meets"] });
      queryClient.invalidateQueries({
        queryKey: meetWhatsappQueryKeys.chats(meetId),
      });
      queryClient.invalidateQueries({
        queryKey: meetWhatsappQueryKeys.invite(meetId),
      });
    },
  });
}

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
