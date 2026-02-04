import { useState } from "react";
import { CreateMeetState, initialState } from "./CreateMeetState";

export function useCreateMeetModalState() {
  const [state, setState] = useState<CreateMeetState>(initialState);

  const mapMeetToState = (meet: Record<string, any>): CreateMeetState => {
    const toDateTimeInput = (value?: string | null) => {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const offset = date.getTimezoneOffset() * 60 * 1000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };
    const toNumberOrEmpty = (value: any) =>
      value === null || value === undefined ? "" : Number(value);
    const toCurrencyUnits = (value: any) =>
      value === null || value === undefined ? "" : Number(value) / 100;

    return {
      ...initialState,
      name: meet.name ?? "",
      description: meet.description ?? "",
      organizerId: meet.organizerId ?? "",
      location: meet.location ?? "",
      locationLat: toNumberOrEmpty(meet.locationLat),
      locationLong: toNumberOrEmpty(meet.locationLong),
      startTime: toDateTimeInput(meet.startTime),
      endTime: toDateTimeInput(meet.endTime),
      startTimeTbc: meet.startTimeTbc ?? meet.timesTbc ?? false,
      endTimeTbc: meet.endTimeTbc ?? false,
      useMap: meet.useMap ?? true,
      openingDate: toDateTimeInput(meet.openingDate),
      closingDate: toDateTimeInput(meet.closingDate),
      capacity: toNumberOrEmpty(meet.capacity),
      waitlistSize: toNumberOrEmpty(meet.waitlistSize),
      autoApprove: meet.autoPlacement ?? true,
      autoCloseWaitlist: meet.autoPromoteWaitlist ?? false,
      allowGuests: meet.allowGuests ?? false,
      maxGuests: toNumberOrEmpty(meet.maxGuests),
      currency: meet.currencyCode ?? initialState.currency,
      costCents: toCurrencyUnits(meet.costCents),
      depositCents: toCurrencyUnits(meet.depositCents),
      approvedResponse: meet.confirmMessage ?? "",
      rejectResponse: meet.rejectMessage ?? "",
      waitlistResponse: meet.waitlistMessage ?? "",
      indemnityAccepted: meet.hasIndemnity ?? false,
      indemnityText: meet.indemnity ?? "",
      allowMinorSign: meet.allowMinorIndemnity ?? false,
      questions: Array.isArray(meet.metaDefinitions)
        ? meet.metaDefinitions.map((definition: any) => ({
            id:
              definition.id ??
              crypto.randomUUID?.() ??
              Math.random().toString(36).slice(2),
            type: definition.fieldType ?? definition.field_type ?? "text", // XXX TODO: fix this
            label: definition.label ?? "",
            required: definition.required ?? false,
            includeInReports: definition.config?.includeInReports ?? false,
            options: Array.isArray(definition.config?.options)
              ? definition.config.options
              : [],
            optionsInput: Array.isArray(definition.config?.options)
              ? definition.config.options.join(", ")
              : "",
            fieldKey:
              definition.fieldKey ?? definition.field_key ?? definition.id,
          }))
        : [],
      statusId: meet.statusId ?? null,
      imagePreview: meet.imageUrl ?? "",
    };
  };

  return {
    state,
    setState,
  };
}
