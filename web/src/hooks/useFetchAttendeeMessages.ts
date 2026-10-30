import { attendeeMessageQueryKeys } from "./attendeeMessageQueryKeys";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type AttendeeMessage = {
  id: string;
  timestamp?: string;
  from?: string;
  to?: string;
  isRead?: boolean;
  content?: string;
  emailStatus?:
    | "pending"
    | "sent"
    | "delivered"
    | "opened"
    | "bounced"
    | "failed"
    | "complained"
    | null;
  recipientEmail?: string | null;
  openedAt?: string | null;
  direction?: "received" | "sent";
};

export type AttendeeAuditLog = {
  id: string;
  timestamp: string;
  description: string;
};

type MessagesResponse =
  | { messages: AttendeeMessage[]; auditLogs?: AttendeeAuditLog[] }
  | AttendeeMessage[];

export function useFetchAttendeeMessages(
  meetId?: string | null,
  attendeeId?: string | null,
) {
  const api = useApi();
  const query = useQuery({
    queryKey: attendeeMessageQueryKeys.attendee(meetId, attendeeId),
    enabled: Boolean(meetId && attendeeId),
    refetchInterval: 15000,
    queryFn: async () => {
      const res = await api.get<MessagesResponse>(
        `/meets/${meetId}/attendees/${attendeeId}/messages`,
      );
      if (Array.isArray(res)) return { messages: res, auditLogs: [] };
      return { messages: res.messages ?? [], auditLogs: res.auditLogs ?? [] };
    },
  });

  return {
    data: query.data?.messages ?? [],
    auditLogs: query.data?.auditLogs ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
