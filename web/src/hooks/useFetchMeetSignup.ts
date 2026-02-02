import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

// TODO: clean this up

type MeetSignupSheet = {
  id: string;
  name: string;
  description?: string;
  location: string;
  start: string;
  end: string;
  organizationId?: string;
  openingDate?: string;
  status: string;
  statusId: number;
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  capacity?: number;
  currency?: string;
  currencySymbol?: string;
  costCents?: number | null;
  indemnityText?: string;
  requiresIndemnity?: boolean;
  allowGuests?: boolean;
  maxGuests?: number | null;
  imageUrl?: string;
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
  startTime?: string;
  endTime?: string;
  organizationId?: string;
  openingDate?: string;
  status?: string;
  statusId?: number;
  organizer?: string;
  organizerName?: string;
  organizerFirstName?: string;
  organizerLastName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  capacity?: number;
  currency?: string;
  currencyCode?: string;
  currency_code?: string;
  currencySymbol?: string;
  costCents?: number | null;
  cost_cents?: number | null;
  indemnityText?: string;
  requires_indemnity?: boolean;
  requiresIndemnity?: boolean;
  indemnity?: string;
  hasIndemnity?: boolean;
  allowGuests?: boolean;
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
    fieldKey?: string;
    label: string;
    fieldType?: string;
    required: boolean;
    position: number;
    config: Record<string, any>;
  }[];
};

const statusLabels: Record<number, string> = {
  1: "Draft",
  2: "Published",
  3: "Open",
  4: "Closed",
  5: "Cancelled",
  6: "Postponed",
  7: "Completed",
};

function mapMeet(apiMeet: MeetApi): MeetSignupSheet {
  const start = apiMeet.startTime || "";
  const end = apiMeet.endTime || "";
  const openingDate = apiMeet.openingDate || undefined;
  const organizationId = apiMeet.organizationId || undefined;
  const status =
    apiMeet.status ||
    (apiMeet.statusId ? statusLabels[apiMeet.statusId] : "Open");
  const currencyCode =
    apiMeet.currencyCode || apiMeet.currency_code || apiMeet.currency;
  const currencySymbol = apiMeet.currencySymbol;
  const costCents = apiMeet.costCents ?? null;
  const organizerName =
    [apiMeet.organizerFirstName, apiMeet.organizerLastName]
      .filter(Boolean)
      .join(" ") ||
    apiMeet.organizerName ||
    apiMeet.organizer ||
    "TBD";
  return {
    id: apiMeet.id,
    name: apiMeet.name,
    description: apiMeet.description,
    location: apiMeet.location,
    start,
    end,
    organizationId,
    openingDate,
    status,
    statusId: apiMeet.statusId,
    organizerName,
    organizerEmail: apiMeet.organizerEmail,
    organizerPhone: apiMeet.organizerPhone,
    capacity: apiMeet.capacity,
    currency: currencyCode,
    currencySymbol,
    costCents,
    indemnityText: apiMeet.indemnityText || apiMeet.indemnity,
    requiresIndemnity: apiMeet.requiresIndemnity ?? apiMeet.hasIndemnity,
    allowGuests: apiMeet.allowGuests,
    maxGuests: apiMeet.maxGuests ?? null,
    imageUrl: (apiMeet as any).imageUrl,
    metaDefinitions: (apiMeet.metaDefinitions || []).map((definition) => ({
      ...definition,
      field_key: definition.field_key || definition.fieldKey || "",
      field_type: definition.field_type || definition.fieldType || "",
    })),
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
    enabled: Boolean(code),
  });
  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
