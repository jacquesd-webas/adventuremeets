import { useState } from "react";

export type MeetSignupSheetState = {
  indemnityAccepted: boolean;
  showIndemnity: boolean;
  fullName: string;
  email: string;
  phone: string;
  wantsGuests: boolean;
  guestCount: number;
  metaValues: Record<string, string | number | boolean>;
};

const initialState: MeetSignupSheetState = {
  indemnityAccepted: false,
  showIndemnity: true,
  fullName: "",
  email: "",
  phone: "",
  wantsGuests: false,
  guestCount: 0,
  metaValues: {}
};

export function useMeetSignupSheetState() {
  const [state, setState] = useState<MeetSignupSheetState>(initialState);

  const setField = <K extends keyof MeetSignupSheetState>(key: K, value: MeetSignupSheetState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const setMetaValue = (key: string, value: string | number | boolean) => {
    setState((prev) => ({ ...prev, metaValues: { ...prev.metaValues, [key]: value } }));
  };

  return { state, setState, setField, setMetaValue };
}
