export const steps = [
  "Basic Info",
  "Time and Location",
  "Indemnity",
  "Questions",
  "Limits",
  "Costs",
  "Responses",
  "Finish"
];

export type QuestionField = {
  id: string;
  type: "text" | "select" | "switch" | "checkbox";
  label: string;
  required?: boolean;
  options?: string[];
};

export type CreateMeetState = {
  name: string;
  description: string;
  organizer: string;
  location: string;
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
};

export const initialState: CreateMeetState = {
  name: "",
  description: "",
  organizer: "You",
  location: "",
  startTime: "",
  endTime: "",
  openingDate: "",
  closingDate: "",
  capacity: "",
  waitlistSize: "",
  autoApprove: true,
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
  questions: []
};

export type StepProps = {
  state: CreateMeetState;
  setState: (fn: (prev: CreateMeetState) => CreateMeetState) => void;
};
