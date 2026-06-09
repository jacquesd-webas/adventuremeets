const pad = (value: number) => String(value).padStart(2, "0");

const toLocalDateTimeInput = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

describe("Create meet with template", () => {
  it("creates a template and uses it while creating a meet", () => {
    const unique = Date.now();
    const email = `cypress.template.meet.${unique}@example.com`;
    const templateName = `Meet Template ${unique}`;
    const meetName = `Template Meet ${unique}`;
    const indemnityText =
      "Template indemnity text for imported meet details.";
    const approvedResponse =
      "Template approved response for attendees joining the meet.";
    const rejectResponse =
      "Template reject response for attendees who could not be accepted.";
    const waitlistResponse =
      "Template waitlist response for attendees waiting on a place.";
    const questionOne = "Emergency contact name";
    const questionTwo = "Preferred hiking pace";
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const startValue = toLocalDateTimeInput(start);

    cy.visit("/register");
    cy.registerWithEmail({
      firstName: "Template",
      lastName: "Creator",
      phone: "5550001111",
      email,
      password: "Str0ng!Passw0rd2026",
    });

    cy.url().should("match", /\/$/);

    cy.openProfileModal();
    cy.contains("Organisation").click();
    cy.contains("Allow regular users to join with invite link")
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("button", "Save organisation").click();

    cy.contains("label", "Invite link")
      .parent()
      .find("input")
      .invoke("val")
      .then((value) => {
        expect(value).to.contain("/register?org=");
        const orgId = new URL(String(value)).searchParams.get("org");
        expect(orgId).to.be.a("string").and.not.be.empty;
        cy.wrap(String(orgId)).as("organizationId");
      });

    cy.closeProfileModal();

    cy.get("@organizationId").then((organizationId) => {
      cy.visit(`/admin/organizations/${organizationId}/templates`);
    });

    cy.contains("button", "Create template").click();

    cy.contains("label", "Name").parent().find("input").type(templateName);
    cy.contains("label", "Description")
      .parent()
      .find("input")
      .type("Template used for meet creation.");

    cy.contains("Questions").click();
    cy.contains("button", "Textfield").click();
    cy.contains("button", "Select").click();

    cy.get('input[placeholder="What should the user see?"]')
      .eq(0)
      .type(questionOne);
    cy.get('input[placeholder="What should the user see?"]')
      .eq(1)
      .type(questionTwo);
    cy.get('input[placeholder="e.g. Beginner, Intermediate, Advanced"]')
      .first()
      .type("Easy, Moderate, Fast");

    cy.contains("Responses").click();
    cy.contains("label", "Approved response")
      .parent()
      .find("textarea")
      .filter(":visible")
      .first()
      .type(approvedResponse, { delay: 0 });
    cy.contains("label", "Reject response")
      .parent()
      .find("textarea")
      .filter(":visible")
      .first()
      .type(rejectResponse, { delay: 0 });
    cy.contains("label", "Waitlist response")
      .parent()
      .find("textarea")
      .filter(":visible")
      .first()
      .type(waitlistResponse, { delay: 0 });

    cy.contains("Indemnity").click();
    cy.contains("label", "Indemnity text")
      .parent()
      .find("textarea")
      .filter(":visible")
      .first()
      .type(indemnityText, { delay: 0 });

    cy.get('[data-testid="create-template-submit"]').click();
    cy.contains(templateName).should("be.visible");

    cy.visit("/plan");
    cy.contains("button", "New meet").click();

    cy.get('input[placeholder="Give your meet a name"]').type(meetName);
    cy.get('textarea[placeholder="Describe your meet in detail here"]')
      .clear()
      .type("Meet created using an organisation template.", { delay: 0 });
    cy.contains("button", "Save & Continue").click();

    cy.get('[data-testid="start-time-input"]').clear().type(startValue);
    cy.contains("button", "Save & Continue").click();

    cy.get('[aria-label="Template"]').click();
    cy.contains('[role="option"]', templateName).click();
    cy.contains("label", "Require attendees to accept indemnity")
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.get(
      'textarea[placeholder="Paste or write indemnity text attendees must accept"]',
    ).should("have.value", indemnityText);
    cy.contains("button", "Save & Continue").click();

    cy.get('[aria-label="Template"]').click();
    cy.contains('[role="option"]', templateName).click();
    cy.get('input[placeholder="What should the user see?"]')
      .eq(0)
      .should("have.value", questionOne);
    cy.get('input[placeholder="What should the user see?"]')
      .eq(1)
      .should("have.value", questionTwo);
    cy.get('input[placeholder="e.g. Beginner, Intermediate, Advanced"]')
      .first()
      .should("have.value", "Easy, Moderate, Fast");
    cy.contains("button", "Save & Continue").click();

    cy.contains("button", "Save & Continue").click();
    cy.contains("button", "Save & Continue").click();

    cy.get('[aria-label="Template"]').click();
    cy.contains('[role="option"]', templateName).click();
    cy.get('[data-testid="approved-response-field"]')
      .find("textarea")
      .filter(":visible")
      .first()
      .should("have.value", approvedResponse);
    cy.get('[data-testid="reject-response-field"]')
      .find("textarea")
      .filter(":visible")
      .first()
      .should("have.value", rejectResponse);
    cy.get('[data-testid="waitlist-response-field"]')
      .find("textarea")
      .filter(":visible")
      .first()
      .should("have.value", waitlistResponse);
    cy.contains("button", "Save & Continue").click();

    cy.contains("button", "Save & Continue").click();

    cy.get('[data-testid="share-link-input"]')
      .invoke("val")
      .then((value) => {
        expect(value).to.match(/\/meets\//);
      });

    cy.contains("button", "Publish").click();
    cy.contains(meetName).should("be.visible");
  });
});

export {};
