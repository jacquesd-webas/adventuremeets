export const steps = [
  "Basic Info",
  "Time and Location",
  "Indemnity",
  "Questions",
  "Limits",
  "Costs",
  "Responses",
  "Image",
  "Finish"
];

export type QuestionField = {
  id: string;
  type: "text" | "select" | "switch" | "checkbox";
  label: string;
  required?: boolean;
  options?: string[];
  fieldKey?: string;
  optionsInput?: string;
};

export type CreateMeetState = {
  name: string;
  description: string;
  organizerId: string;
  location: string;
  locationLat: number | string;
  locationLong: number | string;
  startTime: string;
  endTime: string;
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
  location: "",
  locationLat: "",
  locationLong: "",
  startTime: "",
  endTime: "",
  openingDate: "",
  closingDate: "",
  capacity: "",
  waitlistSize: 0,
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
  statusId: null
};

export type StepProps = {
  state: CreateMeetState;
  setState: (fn: (prev: CreateMeetState) => CreateMeetState) => void;
};
