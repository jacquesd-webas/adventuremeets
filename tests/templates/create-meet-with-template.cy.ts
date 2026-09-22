const pad = (value: number) => String(value).padStart(2, "0");

const toLocalDateTimeInput = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

type TemplateQuestion = {
  type: "text" | "select" | "switch" | "checkbox";
  label: string;
  options?: string;
};

function createTemplate(options: {
  organizationId: string;
  templateName: string;
  description: string;
  questions: TemplateQuestion[];
  indemnityText?: string;
  approvedResponse?: string;
  rejectResponse?: string;
  waitlistResponse?: string;
}) {
  cy.visit(`/admin/organizations/${options.organizationId}/templates`);
  cy.contains("button", "Create template").click();

  cy.contains("label", "Name")
    .parent()
    .find("input")
    .type(options.templateName);
  cy.contains("label", "Description")
    .parent()
    .find("input")
    .type(options.description);

  if (options.questions.length) {
    cy.contains("Questions").click();

    options.questions.forEach((question) => {
      const buttonLabel =
        question.type === "text"
          ? "Textfield"
          : question.type === "select"
            ? "Select"
            : question.type === "switch"
              ? "Switch"
              : "Checkbox";
      cy.contains("button", buttonLabel).click();
    });

    options.questions.forEach((question, index) => {
      cy.get('input[placeholder="What should the user see?"]')
        .eq(index)
        .type(question.label);

      if (question.type === "select" && question.options) {
        cy.get('input[placeholder="e.g. Beginner, Intermediate, Advanced"]')
          .eq(
            options.questions
              .slice(0, index + 1)
              .filter((item) => item.type === "select").length - 1,
          )
          .type(question.options);
      }
    });
  }

  if (
    options.approvedResponse ||
    options.rejectResponse ||
    options.waitlistResponse
  ) {
    cy.contains("Responses").click();

    if (options.approvedResponse) {
      cy.contains("label", "Approved response")
        .parent()
        .find("textarea")
        .filter(":visible")
        .first()
        .type(options.approvedResponse, { delay: 0 });
    }
    if (options.rejectResponse) {
      cy.contains("label", "Reject response")
        .parent()
        .find("textarea")
        .filter(":visible")
        .first()
        .type(options.rejectResponse, { delay: 0 });
    }
    if (options.waitlistResponse) {
      cy.contains("label", "Waitlist response")
        .parent()
        .find("textarea")
        .filter(":visible")
        .first()
        .type(options.waitlistResponse, { delay: 0 });
    }
  }

  if (options.indemnityText) {
    cy.contains("Indemnity").click();
    cy.contains("label", "Indemnity text")
      .parent()
      .find("textarea")
      .filter(":visible")
      .first()
      .type(options.indemnityText, { delay: 0 });
  }

  cy.get('[data-testid="create-template-submit"]').click();
  cy.contains(options.templateName).should("be.visible");
}

describe("Create meet with template", () => {
  it("creates two templates, applies both, and keeps template questions and indemnity in the final form", () => {
    const unique = Date.now();
    const email = `cypress.template.meet.${unique}@example.com`;
    const templateNameOne = `Meet Template A ${unique}`;
    const templateNameTwo = `Meet Template B ${unique}`;
    const meetName = `Template Meet ${unique}`;
    const indemnityText = "Template indemnity text for imported meet details.";
    const approvedResponse =
      "Template approved response for attendees joining the meet.";
    const rejectResponse =
      "Template reject response for attendees who could not be accepted.";
    const waitlistResponse =
      "Template waitlist response for attendees waiting on a place.";
    const questionOne = `Emergency contact name ${unique}`;
    const questionTwo = `Preferred hiking pace ${unique}`;
    const questionThree = `Medical aid number ${unique}`;
    const questionFour = `Transport available ${unique}`;
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

    cy.get('[data-testid="account-menu-button"]').click();
    cy.get('[role="menu"]').should("be.visible");
    cy.contains('[role="menuitem"]', "Organisation").click();
    cy.get('[data-testid="organization-modal"]').should("be.visible");
    cy.get('[data-testid="organization-modal"]').contains("Privacy").click();
    cy.contains("Allow regular users to join with invite link")
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("button", "Save privacy settings").click();

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

    cy.get('[data-testid="close-organization-modal"]').click();
    cy.get('[data-testid="organization-modal"]').should("not.exist");

    cy.get("@organizationId").then((organizationId) => {
      createTemplate({
        organizationId: String(organizationId),
        templateName: templateNameOne,
        description: "Template A used for meet creation.",
        questions: [
          { type: "text", label: questionOne },
          {
            type: "select",
            label: questionTwo,
            options: "Easy, Moderate, Fast",
          },
        ],
        indemnityText,
        approvedResponse,
        rejectResponse,
        waitlistResponse,
      });

      createTemplate({
        organizationId: String(organizationId),
        templateName: templateNameTwo,
        description: "Template B used for meet creation.",
        questions: [
          { type: "text", label: questionThree },
          { type: "switch", label: questionFour },
        ],
      });
    });

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
    cy.contains('[role="option"]', templateNameOne).click();
    cy.get('input[aria-label="Require attendees to accept indemnity"]').check({
      force: true,
    });
    cy.get(
      'textarea[placeholder="Paste or write indemnity text attendees must accept"]',
    ).should("have.value", indemnityText);
    cy.contains("button", "Save & Continue").click();

    cy.get('[aria-label="Template"]').click();
    cy.contains('[role="option"]', templateNameOne).click();
    cy.get('[aria-label="Template"]').click();
    cy.contains('[role="option"]', templateNameTwo).click();
    cy.get('input[placeholder="What should the user see?"]')
      .eq(0)
      .should("have.value", questionOne);
    cy.get('input[placeholder="What should the user see?"]')
      .eq(1)
      .should("have.value", questionTwo);
    cy.get('input[placeholder="What should the user see?"]')
      .eq(2)
      .should("have.value", questionThree);
    cy.get('input[placeholder="What should the user see?"]')
      .eq(3)
      .should("have.value", questionFour);
    cy.get('input[placeholder="e.g. Beginner, Intermediate, Advanced"]')
      .first()
      .should("have.value", "Easy, Moderate, Fast");
    cy.contains("button", "Save & Continue").click();

    cy.contains("button", "Save & Continue").click();
    cy.contains("button", "Save & Continue").click();

    cy.get('[aria-label="Template"]').click();
    cy.contains('[role="option"]', templateNameOne).click();
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
        cy.wrap(String(value)).as("shareLink");
      });

    cy.contains("button", "Publish").click();
    cy.contains(meetName).should("be.visible");

    cy.get("@shareLink").then((shareLink) => {
      cy.visit(String(shareLink));
    });

    cy.contains(indemnityText).should("be.visible");
    cy.contains("I accept the indemnity").should("be.visible");
    cy.contains(questionOne).should("be.visible");
    cy.contains(questionTwo).should("be.visible");
    cy.contains(questionThree).should("be.visible");
    cy.contains(questionFour).should("be.visible");
  });
});

export {};
