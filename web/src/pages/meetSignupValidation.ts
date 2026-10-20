import type Meet from "../types/MeetModel";
import type { MeetSignupSheetState } from "./MeetSignupSheetState";
import {
  validateEmail,
  validatePhone,
  validateRequired,
} from "../helpers/validation";

export type SignupErrors = Record<string, string>;

export function getMeetSignupErrors(
  meet: Meet,
  state: MeetSignupSheetState,
  phoneLocal: string,
): SignupErrors {
  const errors: SignupErrors = {};
  const addError = (key: string, message: string | null) => {
    if (message) errors[key] = message;
  };

  addError("fullName", validateRequired(state.fullName, "Name"));
  if (state.isMinor) {
    addError(
      "guardianName",
      validateRequired(state.guardianName, "Parent or guardian name"),
    );
  }
  if (meet.requireEmail !== false)
    addError("email", validateEmail(state.email));
  if (meet.requirePhone !== false) addError("phone", validatePhone(phoneLocal));
  if (meet.requireOrg1 && meet.customField1Name) {
    addError(
      "org1Value",
      validateRequired(state.org1Value, meet.customField1Name),
    );
  }
  if (meet.requireOrg2 && meet.customField2Name) {
    addError(
      "org2Value",
      validateRequired(state.org2Value, meet.customField2Name),
    );
  }
  if (state.wantsGuests) {
    state.guests.forEach((guest, index) => {
      addError(
        `guest:${index}`,
        validateRequired(guest.name, `Guest ${index + 1} name`),
      );
    });
  }
  for (const field of meet.metaDefinitions || []) {
    if (!field.required) continue;
    const value = state.metaValues[field.fieldKey];
    const missing =
      field.fieldType === "checkbox" || field.fieldType === "switch"
        ? value !== true
        : value === undefined || value === null || String(value).trim() === "";
    if (missing)
      errors[`meta:${field.fieldKey}`] = `${field.label} is required`;
  }
  if (
    meet.hasIndemnity &&
    !meet.hasPdfIndemnityTemplate &&
    !state.indemnityAccepted
  ) {
    errors.indemnityAccepted = "Accept the indemnity to continue";
  }
  return errors;
}
