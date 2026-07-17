import { useQuery } from "@tanstack/react-query";
import Meet from "../types/MeetModel";
import { useApi } from "./useApi";

const statusLabels: Record<number, string> = {
  1: "Draft",
  2: "Published",
  3: "Open",
  4: "Closed",
  5: "Cancelled",
  6: "Postponed",
  7: "Completed",
};

function mapMeet(apiMeet: Record<string, any>): Meet {
  const organizerName =
    [apiMeet.organizerFirstName, apiMeet.organizerLastName]
      .filter(Boolean)
      .join(" ") ||
    apiMeet.organizerName ||
    apiMeet.organizer ||
    undefined;

  return {
    id: apiMeet.id,
    name: apiMeet.name,
    organizerId: apiMeet.organizerId ?? "",
    description: apiMeet.description ?? null,
    organizationId: apiMeet.organizationId ?? null,
    location: apiMeet.location ?? null,
    locationLat: apiMeet.locationLat ?? apiMeet.location_lat ?? null,
    locationLong: apiMeet.locationLong ?? apiMeet.location_long ?? null,
    startTime: apiMeet.startTime ?? null,
    endTime: apiMeet.endTime ?? null,
    startTimeTbc: apiMeet.startTimeTbc ?? apiMeet.start_time_tbc ?? null,
    endTimeTbc: apiMeet.endTimeTbc ?? apiMeet.end_time_tbc ?? null,
    useMap: apiMeet.useMap ?? null,
    openingDate: apiMeet.openingDate ?? null,
    closingDate: apiMeet.closingDate ?? null,
    scheduledDate: apiMeet.scheduledDate ?? null,
    confirmDate: apiMeet.confirmDate ?? null,
    status:
      apiMeet.status ||
      (apiMeet.statusId ? statusLabels[apiMeet.statusId] : undefined),
    statusId: apiMeet.statusId ?? null,
    organizerName,
    organizerFirstName: apiMeet.organizerFirstName ?? null,
    organizerLastName: apiMeet.organizerLastName ?? null,
    organizerEmail: apiMeet.organizerEmail ?? null,
    organizerPhone: apiMeet.organizerPhone ?? null,
    imageUrl: apiMeet.imageUrl ?? apiMeet.image_url ?? null,
    images: (apiMeet.images || []).map((image: any) => ({
      id: image.id,
      meetId: image.meetId ?? image.meet_id ?? "",
      url: image.url,
      isPrimary: Boolean(image.isPrimary ?? image.is_primary),
      aspect: image.aspect ?? "O",
      objectKey: image.objectKey ?? image.object_key ?? undefined,
      contentType: image.contentType ?? image.content_type ?? undefined,
      sizeBytes: image.sizeBytes ?? image.size_bytes ?? undefined,
      createdAt: image.createdAt ?? image.created_at ?? undefined,
    })),
    capacity: apiMeet.capacity ?? null,
    waitlistSize: apiMeet.waitlistSize ?? null,
    autoPlacement: apiMeet.autoPlacement ?? null,
    autoPromoteWaitlist: apiMeet.autoPromoteWaitlist ?? null,
    allowGuests: apiMeet.allowGuests ?? null,
    allowSelfCheckin:
      apiMeet.allowSelfCheckin ?? apiMeet.allow_self_checkin ?? null,
    checkinPin: apiMeet.checkinPin ?? apiMeet.checkin_pin ?? null,
    allowWalkins: apiMeet.allowWalkins ?? apiMeet.allow_walkins ?? null,
    requireEmail: apiMeet.requireEmail ?? apiMeet.require_email ?? null,
    requirePhone: apiMeet.requirePhone ?? apiMeet.require_phone ?? null,
    requireOrg1: apiMeet.requireOrg1 ?? apiMeet.require_org1 ?? null,
    requireOrg2: apiMeet.requireOrg2 ?? apiMeet.require_org2 ?? null,
    customField1Name:
      apiMeet.customField1Name ?? apiMeet.custom_field1_name ?? null,
    customField2Name:
      apiMeet.customField2Name ?? apiMeet.custom_field2_name ?? null,
    customField1HelperText:
      apiMeet.customField1HelperText ??
      apiMeet.custom_field1_helper_text ??
      null,
    customField2HelperText:
      apiMeet.customField2HelperText ??
      apiMeet.custom_field2_helper_text ??
      null,
    maxGuests: apiMeet.maxGuests ?? null,
    isVirtual: apiMeet.isVirtual ?? null,
    shareCode: apiMeet.shareCode ?? null,
    currency:
      apiMeet.currencyCode ?? apiMeet.currency_code ?? apiMeet.currency ?? null,
    currencyId: apiMeet.currencyId ?? null,
    currencySymbol: apiMeet.currencySymbol ?? null,
    costCents: apiMeet.costCents ?? apiMeet.cost_cents ?? null,
    depositCents: apiMeet.depositCents ?? null,
    waitlistMessage: apiMeet.waitlistMessage ?? null,
    confirmMessage: apiMeet.confirmMessage ?? null,
    rejectMessage: apiMeet.rejectMessage ?? null,
    hasIndemnity: apiMeet.hasIndemnity ?? apiMeet.requiresIndemnity ?? null,
    indemnity: apiMeet.indemnity ?? apiMeet.indemnityText ?? null,
    allowMinorIndemnity: apiMeet.allowMinorIndemnity ?? null,
    attendeeCount: apiMeet.attendeeCount ?? apiMeet.attendee_count ?? null,
    waitlistCount: apiMeet.waitlistCount ?? null,
    confirmedCount: apiMeet.confirmedCount ?? null,
    rejectedCount: apiMeet.rejectedCount ?? null,
    checkedInCount: apiMeet.checkedInCount ?? null,
    isHidden: apiMeet.isHidden ?? null,
    myAttendeeStatus: apiMeet.myAttendeeStatus ?? null,
    attendingAttendees: (
      apiMeet.attendingAttendees ??
      apiMeet.attending_attendees ??
      []
    ).map((attendee: any) => ({
      id: attendee.id,
      name: attendee.name,
      avatarUrl: attendee.avatarUrl ?? attendee.avatar_url ?? null,
    })),
    metaDefinitions: (
      apiMeet.metaDefinitions ||
      apiMeet.meta_definitions ||
      []
    ).map((definition: any) => ({
      id: definition.id,
      fieldKey: definition.fieldKey ?? definition.field_key ?? "",
      label: definition.label,
      fieldType: definition.fieldType ?? definition.field_type ?? "text",
      required:
        definition.required === undefined
          ? undefined
          : Boolean(definition.required),
      position:
        definition.position === undefined
          ? undefined
          : Number(definition.position),
      config: definition.config ?? {},
    })),
  };
}

export function useFetchMeetSignup(code?: string) {
  const api = useApi();
  const query = useQuery({
    queryKey: ["meet", code],
    queryFn: async () => {
      if (!code) return null;
      const res = await api.get<Record<string, any>>(`/meets/${code}`);
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
