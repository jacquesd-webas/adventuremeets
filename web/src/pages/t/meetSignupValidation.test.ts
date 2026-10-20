import { getMeetSignupErrors } from "../meetSignupValidation";
import type Meet from "../../types/MeetModel";
import type { MeetSignupSheetState } from "../MeetSignupSheetState";

const meet: Meet = {
  id: "meet-1",
  name: "Mountain Hike",
  organizerId: "user-1",
  hasIndemnity: true,
  requireEmail: false,
  requirePhone: false,
  metaDefinitions: [
    {
      id: "question-1",
      fieldKey: "consent",
      label: "Medical consent",
      fieldType: "switch",
      required: true,
    },
  ],
};

const state: MeetSignupSheetState = {
  indemnityAccepted: false,
  showIndemnity: true,
  fullName: "Child Name",
  email: "",
  phone: "",
  org1Value: "",
  org2Value: "",
  wantsGuests: true,
  guests: [{ name: "", isMinor: false }],
  metaValues: { consent: false },
  guardianName: "",
  isMinor: true,
};

it("validates minor guardian details, guests, required switches, and indemnity", () => {
  expect(getMeetSignupErrors(meet, state, "")).toEqual({
    guardianName: "Parent or guardian name is required",
    "guest:0": "Guest 1 name is required",
    "meta:consent": "Medical consent is required",
    indemnityAccepted: "Accept the indemnity to continue",
  });
});

it("does not require electronic acceptance when the indemnity is a PDF form", () => {
  expect(
    getMeetSignupErrors({ ...meet, hasPdfIndemnityTemplate: true }, state, ""),
  ).not.toHaveProperty("indemnityAccepted");
});
