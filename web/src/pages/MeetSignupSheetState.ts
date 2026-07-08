import { useCallback, useState } from "react";
import { GuestInput } from "../types/GuestInput";

export type MeetSignupSheetState = {
  indemnityAccepted: boolean;
  showIndemnity: boolean;
  fullName: string;
  email: string;
  phone: string;
  wantsGuests: boolean;
  guests: GuestInput[];
  metaValues: Record<string, string | number | boolean | null>;
  guardianName: string;
  isMinor: boolean;
};

const initialState: MeetSignupSheetState = {
  indemnityAccepted: false,
  showIndemnity: true,
  fullName: "",
  email: "",
  phone: "",
  wantsGuests: false,
  guests: [],
  metaValues: {},
  guardianName: "",
  isMinor: false,
};

export function useMeetSignupSheetState() {
  const [state, setState] = useState<MeetSignupSheetState>(initialState);

  const setField = useCallback(
    <K extends keyof MeetSignupSheetState>(
      key: K,
      value: MeetSignupSheetState[K],
    ) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setMetaValue = useCallback(
    (key: string, value: string | number | boolean | null) => {
      setState((prev) => ({
        ...prev,
        metaValues: { ...prev.metaValues, [key]: value },
      }));
    },
    [],
  );

  const resetState = useCallback(() => setState(initialState), []);

  return { state, setState, setField, setMetaValue, resetState };
}
