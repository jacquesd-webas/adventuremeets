import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

type MeetSignupSheet = {
  id: string;
  name: string;
  description?: string;
  location: string;
  start: string;
  end: string;
  status: string;
  organizerName?: string;
  indemnityText?: string;
  requiresIndemnity?: boolean;
  allowGuests?: boolean;
  maxGuests?: number | null;
  metaDefinitions?: {
    id: string;
    field_key?: string;
    fieldKey?: string;
    label: string;
    field_type?: string;
    fieldType?: string;
    required: boolean;
    position: number;
    config: Record<string, any>;
  }[];
};

type MeetApi = {
  id: string;
  name: string;
  description?: string;
  location: string;
  start_time?: string;
  end_time?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  status_id?: number;
  organizer?: string;
  organizer_name?: string;
  organizer_first_name?: string;
  organizer_last_name?: string;
  organizerFirstName?: string;
  organizerLastName?: string;
  indemnity_text?: string;
  indemnityText?: string;
  requires_indemnity?: boolean;
  requiresIndemnity?: boolean;
  indemnity?: string;
  has_indemnity?: boolean;
  hasIndemnity?: boolean;
  allow_guests?: boolean;
  allowGuests?: boolean;
  max_guests?: number | null;
  maxGuests?: number | null;
  meta_definitions?: {
    id: string;
    field_key: string;
    label: string;
    field_type: string;
    required: boolean;
    position: number;
    config: Record<string, any>;
  }[];
  metaDefinitions?: {
    id: string;
    field_key?: string;
    fieldKey?: string;
    label: string;
    field_type?: string;
    fieldType?: string;
    required: boolean;
    position: number;
    config: Record<string, any>;
  }[];
};

const statusLabels: Record<number, string> = {
  1: "Draft",
  2: "Published",
  3: "Closed",
  4: "Cancelled",
  5: "Postponed"
};

function mapMeet(apiMeet: MeetApi): MeetSignupSheet {
  const start = apiMeet.start_time || apiMeet.startTime || "";
  const end = apiMeet.end_time || apiMeet.endTime || "";
  const status = apiMeet.status || (apiMeet.status_id ? statusLabels[apiMeet.status_id] : "Open");
  const organizerName =
    [apiMeet.organizerFirstName || apiMeet.organizer_first_name, apiMeet.organizerLastName || apiMeet.organizer_last_name]
      .filter(Boolean)
      .join(" ") ||
    apiMeet.organizer ||
    apiMeet.organizer_name ||
    "TBD";
  return {
    id: apiMeet.id,
    name: apiMeet.name,
    description: apiMeet.description,
    location: apiMeet.location,
    start,
    end,
    status,
    organizerName,
    indemnityText: apiMeet.indemnityText || apiMeet.indemnity_text || apiMeet.indemnity,
    requiresIndemnity:
      apiMeet.requiresIndemnity ??
      apiMeet.requires_indemnity ??
      apiMeet.hasIndemnity ??
      apiMeet.has_indemnity,
    allowGuests: apiMeet.allowGuests ?? apiMeet.allow_guests,
    maxGuests: apiMeet.maxGuests ?? apiMeet.max_guests ?? null,
    metaDefinitions: (apiMeet.metaDefinitions || apiMeet.meta_definitions || []).map((definition) => ({
      ...definition,
      field_key: definition.field_key || definition.fieldKey || "",
      field_type: definition.field_type || definition.fieldType || ""
    }))
  };
}

export function useFetchMeetSignup(code?: string) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["meet", code],
    queryFn: async () => {
      if (!code) return null;
      const res = await api.get<MeetApi>(`/meets/${code}`);
      return mapMeet(res);
    },
    enabled: Boolean(code)
  });
  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null
  };
}
