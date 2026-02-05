export const steps = [
  "Basic Info",
  "Time and Location",
  "Indemnity",
  "Questions",
  "Limits",
  "Costs",
  "Responses",
  "Image",
  "Finish",
];

export type QuestionField = {
  id: string;
  type: "text" | "select" | "switch" | "checkbox";
  label: string;
  required?: boolean;
  includeInReports?: boolean;
  options?: string[];
  fieldKey?: string;
  optionsInput?: string;
};

export type CreateMeetState = {
  name: string;
  description: string;
  organizerId: string;
  organizationId: string;
  location: string;
  locationLat: number | string;
  locationLong: number | string;
  startTime: string;
  endTime: string;
  startTimeTbc: boolean;
  endTimeTbc: boolean;
  useMap: boolean;
  openingDate: string;
  closingDate: string;
  capacity: number | string;
  waitlistSize: number | string;
  autoApprove: boolean;
  autoCloseWaitlist: boolean;
  allowGuests: boolean;
  maxGuests: number | string;
  currency: string;
  costCents: number | string;
  depositCents: number | string;
  approvedResponse: string;
  rejectResponse: string;
  waitlistResponse: string;
  indemnityAccepted: boolean;
  indemnityText: string;
  allowMinorSign: boolean;
  duration?: string;
  questions: QuestionField[];
  imageFile: File | null;
  imagePreview: string;
  statusId: number | null;
};

export const initialState: CreateMeetState = {
  name: "",
  description: "",
  organizerId: "",
  organizationId: "",
  location: "",
  locationLat: "",
  locationLong: "",
  startTime: "",
  endTime: "",
  startTimeTbc: false,
  endTimeTbc: false,
  useMap: true,
  openingDate: "",
  closingDate: "",
  capacity: "",
  waitlistSize: "",
  autoApprove: false,
  autoCloseWaitlist: false,
  allowGuests: false,
  maxGuests: "",
  currency: "ZAR",
  costCents: "",
  depositCents: "",
  approvedResponse: "",
  rejectResponse: "",
  waitlistResponse: "",
  indemnityAccepted: false,
  indemnityText: "",
  allowMinorSign: false,
  duration: "",
  questions: [],
  imageFile: null,
  imagePreview: "",
  statusId: null,
};

export type StepProps = {
  state: CreateMeetState;
  setState: (fn: (prev: CreateMeetState) => CreateMeetState) => void;
  errors?: FieldError[];
};

export const mapMeetToState = (meet: Record<string, any>): CreateMeetState => {
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
    startTimeTbc: meet.startTimeTbc ?? false,
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

export const toIsoWithOffset = (value?: string) => {
  if (!value) return undefined;
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  const [datePart, timePart] = value.split("T");
  if (!datePart) return undefined;
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const [hour = 0, minute = 0] = (timePart || "00:00").split(":").map(Number);
  const local = new Date(year, month - 1, day, hour, minute, 0, 0);
  const offsetMinutes = local.getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(abs / 60)).padStart(2, "0");
  const offsetMins = String(abs % 60).padStart(2, "0");
  const yyyy = String(local.getFullYear());
  const mm = String(local.getMonth() + 1).padStart(2, "0");
  const dd = String(local.getDate()).padStart(2, "0");
  const hh = String(local.getHours()).padStart(2, "0");
  const min = String(local.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00${sign}${offsetHours}:${offsetMins}`;
};

export const ensureMidnightIfDateOnly = (value?: string) => {
  if (!value) return undefined;
  return value.includes("T") ? value : `${value}T00:00`;
};

export const validateStep = (step: number, draft: CreateMeetState) => {
  const errors: { field: string; message: string; step: number }[] = [];
  switch (step) {
    case 0:
      if (!draft.name.trim())
        errors.push({
          field: "name",
          message: "Meet name is required",
          step,
        });
      if (!draft.description.trim())
        errors.push({
          field: "description",
          message: "Description is required",
          step,
        });
      if (!draft.organizerId)
        errors.push({
          field: "organizerId",
          message: "Please select an organizer",
          step,
        });
      break;
    case 1:
      if (!draft.startTime)
        errors.push({
          field: "startTime",
          message: "Start time is required",
          step,
        });
      break;
    case 4:
      if (
        draft.capacity !== undefined &&
        draft.capacity !== "" &&
        Number(draft.capacity) < 0
      ) {
        errors.push({
          field: "capacity",
          message: "Capacity cannot be negative",
          step,
        });
      }
      if (
        draft.waitlistSize !== undefined &&
        draft.waitlistSize !== "" &&
        Number(draft.waitlistSize) < 0
      ) {
        errors.push({
          field: "waitlistSize",
          message: "Waitlist size cannot be negative",
          step,
        });
      }
      break;
    default:
      break;
  }
  return errors;
};

export const validateAll = (draft: CreateMeetState) => {
  return [
    ...validateStep(0, draft),
    ...validateStep(1, draft),
    ...validateStep(4, draft),
  ];
};

export type FieldError = {
  field: string;
  message: string;
  step: number;
};

export const getFieldError = (
  fieldErrors: FieldError[],
  field: string,
): string | undefined => {
  const error = fieldErrors.find((err) => err.field === field);
  return error ? error.message : undefined;
};
