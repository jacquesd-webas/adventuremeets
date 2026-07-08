import { Template } from "../../types/TemplateModel";
import { CreateMeetState, initialState } from "./CreateMeetState";

export function mapTemplateDefinitionsToQuestions(template?: Template) {
  return (template?.metaDefinitions || []).map((definition, index) => ({
    id:
      definition.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)),
    type: ["text", "select", "switch", "checkbox"].includes(
      definition.fieldType,
    )
      ? (definition.fieldType as CreateMeetState["questions"][number]["type"])
      : "text",
    label: definition.label || "",
    required: Boolean(definition.required),
    includeInReports: definition.config?.includeInReports ?? false,
    options:
      definition.fieldType === "select"
        ? (definition.config?.options as string[]) || []
        : undefined,
    optionsInput:
      definition.fieldType === "select"
        ? ((definition.config?.options as string[]) || []).join(", ")
        : "",
    fieldKey: definition.fieldKey || `field_${index + 1}`,
  }));
}

export function applyDefaultTemplateToState(
  draft: CreateMeetState,
  template?: Template | null,
): CreateMeetState {
  if (!template) return draft;

  return {
    ...draft,
    questions: template.metaDefinitions?.length
      ? mapTemplateDefinitionsToQuestions(template)
      : draft.questions,
    indemnityText: draft.indemnityText.trim() || template.indemnity || "",
    approvedResponse:
      draft.approvedResponse.trim() || template.approvedResponse || "",
    rejectResponse:
      draft.rejectResponse.trim() || template.rejectResponse || "",
    waitlistResponse:
      draft.waitlistResponse.trim() || template.waitlistResponse || "",
  };
}

type OrganizationDefaults = {
  defaultRequireIndemnity?: boolean;
  defaultAutoApproveAttendees?: boolean;
  defaultAllowGuests?: boolean;
  defaultAllowSelfCheckin?: boolean;
  defaultAllowWalkins?: boolean;
};

export function buildCreateMeetStateFromOrganizationDefaults({
  currency,
  currentOrganizationId,
  organization,
  template,
  userId,
}: {
  currency?: string;
  currentOrganizationId: string;
  organization: OrganizationDefaults;
  template?: Template | null;
  userId: string;
}): CreateMeetState {
  return applyDefaultTemplateToState(
    {
      ...initialState,
      currency: currency || initialState.currency,
      organizerId: userId,
      organizationId: currentOrganizationId,
      indemnityAccepted: Boolean(organization.defaultRequireIndemnity),
      autoApprove: Boolean(organization.defaultAutoApproveAttendees),
      allowGuests: Boolean(organization.defaultAllowGuests),
      allowSelfCheckin: Boolean(organization.defaultAllowSelfCheckin),
      allowWalkins: Boolean(organization.defaultAllowWalkins),
    },
    template,
  );
}
