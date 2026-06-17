type RegisterWithEmailOptions = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
};

type CreateMinimalMeetQuestion = {
  type: "text" | "select" | "switch" | "checkbox";
  label: string;
  options?: string[];
};

type CreateMinimalMeetOptions = {
  meetName: string;
  description?: string;
  start?: Date | string;
  requireIndemnity?: boolean;
  includeQuestions?: boolean;
  questions?: CreateMinimalMeetQuestion[];
  requiredStandardFields?: string[];
  allowGuests?: boolean;
  maxGuests?: number;
  allowSelfCheckin?: boolean;
  allowWalkins?: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");

const toLocalDateTimeInput = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

declare global {
  namespace Cypress {
    interface Chainable {
      registerWithEmail(options: RegisterWithEmailOptions): Chainable<void>;
      createMinimalMeet(options: CreateMinimalMeetOptions): Chainable<string>;
      openProfileModal(): Chainable<void>;
      closeProfileModal(): Chainable<void>;
      logout(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("registerWithEmail", (options: RegisterWithEmailOptions) => {
  cy.contains("Continue with Email").click();

  cy.get('input[type="text"]').first().type(options.firstName);
  cy.get('input[type="text"]').eq(1).type(options.lastName);
  cy.get('input[placeholder="Mobile phone number"]').type(options.phone);
  cy.get('input[type="email"]').type(options.email);
  cy.get('input[type="password"]').type(options.password);

  cy.contains("button", "Create account").click();
});

Cypress.Commands.add("createMinimalMeet", (options: CreateMinimalMeetOptions) => {
  const description = options.description ?? "Short description for signup test.";
  const start =
    typeof options.start === "string"
      ? options.start
      : toLocalDateTimeInput(
          options.start ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
        );

  cy.visit("/plan");
  cy.contains("button", "New meet").click();

  cy.get('input[placeholder="Give your meet a name"]').type(options.meetName);
  cy.get('textarea[placeholder="Describe your meet in detail here"]')
    .clear()
    .type(description, { delay: 0 });
  cy.contains("button", "Save & Continue").click();

  cy.get('[data-testid="start-time-input"]').clear().type(start);
  cy.contains("button", "Save & Continue").click();

  if (options.requireIndemnity) {
    cy.get(
      'textarea[placeholder="Paste or write indemnity text attendees must accept"]',
    )
      .clear()
      .type(
        "By attending this meet, you accept the risks and agree to act responsibly.",
        { delay: 0 },
      );
    cy.contains("label", "Require attendees to accept indemnity")
      .find('input[type="checkbox"]')
      .check({ force: true });
  }
  cy.contains("button", "Save & Continue").click();

  if (options.includeQuestions || options.questions?.length) {
    const defaultQuestions: CreateMinimalMeetQuestion[] = [
      {
        type: "text",
        label: "Dietary notes",
      },
      {
        type: "select",
        label: "Pace preference",
        options: ["Easy", "Moderate", "Fast"],
      },
      {
        type: "switch",
        label: "Bringing extra water?",
      },
      {
        type: "checkbox",
        label: "Agree to leave no trace?",
      },
    ];
    const questions = options.questions ?? defaultQuestions;

    questions.forEach((question) => {
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

    questions.forEach((question, index) => {
      cy.get('input[placeholder="What should the user see?"]')
        .eq(index)
        .type(question.label);
      if (question.type === "select") {
        cy.get('input[placeholder="e.g. Beginner, Intermediate, Advanced"]')
          .eq(
            questions
              .slice(0, index + 1)
              .filter((item) => item.type === "select").length - 1,
          )
          .type((question.options ?? []).join(", "));
      }
    });
  }

  (options.requiredStandardFields ?? []).forEach((label) => {
    cy.contains("label", label).find('input[type="checkbox"]').check({
      force: true,
    });
  });
  cy.contains("button", "Save & Continue").click();

  if (options.allowGuests) {
    cy.contains("label", "Allow attendees to bring guests")
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.get('input[placeholder="How many guests per attendee?"]')
      .clear()
      .type(String(options.maxGuests ?? 1));
  }
  if (options.allowWalkins) {
    cy.contains("label", "Allow walk-ins")
      .find('input[type="checkbox"]')
      .check({ force: true });
  } else if (options.allowSelfCheckin) {
    cy.contains("label", "Allow self check-in")
      .find('input[type="checkbox"]')
      .check({ force: true });
  }
  cy.contains("button", "Save & Continue").click();

  cy.contains("button", "Save & Continue").click();
  cy.contains("button", "Save & Continue").click();
  cy.contains("button", "Save & Continue").click();

  return cy
    .get('[data-testid="share-link-input"]')
    .invoke("val")
    .then((value) => {
      expect(value).to.match(/\/meets\//);
      const shareLink = String(value);
      return cy.contains("button", "Publish").click().then(() => shareLink);
    });
});

Cypress.Commands.add("openProfileModal", () => {
  cy.get('[data-testid="account-menu-button"]').click();
  cy.get('[role="menu"]').should("be.visible");
  cy.get('[data-testid="account-profile-menu-item"]').click();
  cy.get('[data-testid="profile-modal"]').should("be.visible");
});

Cypress.Commands.add("closeProfileModal", () => {
  cy.get('[data-testid="close-profile-modal"]').click();
  cy.get('[data-testid="profile-modal"]').should("not.exist");
});

Cypress.Commands.add("logout", () => {
  cy.get('[data-testid="account-menu-button"]').click();
  cy.get('[role="menu"]').should("be.visible");
  cy.contains('[role="menuitem"]', "Logout").click();
});

export {};
