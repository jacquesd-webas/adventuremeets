import { describe, expect, it } from "vitest";
import { buildCreateMeetStateFromOrganizationDefaults } from "../createMeetDefaults";

describe("createMeetDefaults", () => {
  it("builds new meet state from organization defaults and template content", () => {
    const state = buildCreateMeetStateFromOrganizationDefaults({
      currency: "USD",
      currentOrganizationId: "org-1",
      organization: {
        defaultRequireIndemnity: true,
        defaultAutoApproveAttendees: true,
        defaultAllowGuests: true,
        defaultAllowSelfCheckin: true,
        defaultAllowWalkins: true,
      },
      template: {
        id: "template-1",
        organizationId: "org-1",
        name: "Welcome template",
        indemnity: "Default indemnity text",
        approvedResponse: "Approved by default",
        rejectResponse: "Rejected by default",
        waitlistResponse: "Waitlisted by default",
        metaDefinitions: [
          {
            id: "meta-1",
            fieldKey: "experience",
            label: "Experience level",
            fieldType: "text",
            required: true,
            config: {},
          },
        ],
        createdAt: "",
        updatedAt: "",
      },
      userId: "organizer-1",
    });

    expect(state.currency).toBe("USD");
    expect(state.organizationId).toBe("org-1");
    expect(state.organizerId).toBe("organizer-1");
    expect(state.indemnityAccepted).toBe(true);
    expect(state.autoApprove).toBe(true);
    expect(state.allowGuests).toBe(true);
    expect(state.allowSelfCheckin).toBe(true);
    expect(state.allowWalkins).toBe(true);
    expect(state.indemnityText).toBe("Default indemnity text");
    expect(state.approvedResponse).toBe("Approved by default");
    expect(state.rejectResponse).toBe("Rejected by default");
    expect(state.waitlistResponse).toBe("Waitlisted by default");
    expect(state.questions).toEqual([
      expect.objectContaining({
        fieldKey: "experience",
        label: "Experience level",
        required: true,
        type: "text",
      }),
    ]);
  });
});
