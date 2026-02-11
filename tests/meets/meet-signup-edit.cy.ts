const pad = (value: number) => String(value).padStart(2, "0");

const toLocalDateTimeInput = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

describe("Meet signup edit", () => {
  it("signs up, edits, and confirms updates persist", () => {
    const unique = Date.now();
    const email = `cypress.min.${unique}@example.com`;
    const meetName = `Signup Meet ${unique}`;
    const description = "Short description for signup test.";
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const startValue = toLocalDateTimeInput(start);

    cy.visit("/register");
    cy.contains("Continue with Email").click();
    cy.get('input[type="text"]').first().type("Cypress");
    cy.get('input[type="text"]').eq(1).type("Signup");
    const randomPhone = `555${Math.floor(1000000 + Math.random() * 9000000)}`;
    cy.get('input[placeholder="Mobile phone number"]').type(randomPhone);
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type("Str0ng!Passw0rd2026");
    cy.contains("button", "Create account").click();
    cy.url().should("match", /\/$/);

    cy.visit("/plan");
    cy.contains("button", "New meet").click();

    cy.get('input[placeholder="Give your meet a name"]').type(meetName);
    cy.get('textarea[placeholder="Describe your meet in detail here"]')
      .clear()
      .type(description, { delay: 0 });
    cy.contains("button", "Save & Continue").click();

    cy.get('[data-testid="start-time-input"]').clear().type(startValue);
    cy.contains("button", "Save & Continue").click();

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
    cy.contains("button", "Save & Continue").click();

    cy.contains("button", "Textfield").click();
    cy.contains("button", "Select").click();
    cy.contains("button", "Switch").click();
    cy.contains("button", "Checkbox").click();

    cy.get('input[placeholder="What should the user see?"]')
      .eq(0)
      .type("Dietary notes");
    cy.get('input[placeholder="What should the user see?"]')
      .eq(1)
      .type("Pace preference");
    cy.get('input[placeholder="e.g. Beginner, Intermediate, Advanced"]')
      .first()
      .type("Easy, Moderate, Fast");
    cy.get('input[placeholder="What should the user see?"]')
      .eq(2)
      .type("Bringing extra water?");
    cy.get('input[placeholder="What should the user see?"]')
      .eq(3)
      .type("Agree to leave no trace?");

    cy.contains("button", "Save & Continue").click();

    for (let i = 0; i < 4; i += 1) {
      cy.contains("button", "Save & Continue").click();
    }

    cy.get('[data-testid="share-link-input"]')
      .invoke("val")
      .then((value) => {
        expect(value).to.match(/\/meets\//);
        cy.wrap(value).as("shareLink");
      });

    cy.contains("button", "Publish").click();

    cy.get('[data-testid="account-menu-button"]').click();
    cy.contains("Logout").click();

    cy.get("@shareLink").then((shareLink) => {
      cy.visit(shareLink as unknown as string);
      cy.wait(20000);
      cy.visit(shareLink as unknown as string);
    });

    cy.get('input[placeholder="Your name"]').type("Signup User");
    cy.get('input[placeholder="you@example.com"]').type(
      `attendee.${unique}@example.com`,
    );
    const randomPhone2 = `555${Math.floor(1000000 + Math.random() * 9000000)}`;
    cy.get('input[placeholder="Mobile phone number"]').type(randomPhone2);
    cy.contains("h6", "Dietary notes")
      .closest(".MuiStack-root")
      .find("input[type=\"text\"]")
      .first()
      .type("No nuts");

    cy.contains("h6", "Pace preference")
      .closest(".MuiStack-root")
      .find('[role="combobox"]')
      .first()
      .click();
    cy.contains("li", "Moderate").click();
    cy.contains("Bringing extra water?")
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("Agree to leave no trace?")
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("I accept the indemnity")
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("button", "Submit application").click();
    cy.contains("Application submitted").should("be.visible");
    cy.contains("button", "Show Status").click();

    cy.contains("button", "Edit Application").click();
    cy.get('input[placeholder="Enter the email used for this application"]')
      .type(`attendee.${unique}@example.com`);
    cy.contains("button", "Continue").click();

    cy.contains("h6", "Dietary notes")
      .closest(".MuiStack-root")
      .find("input[type=\"text\"]")
      .first()
      .clear()
      .type("No nuts please");
    cy.contains("button", "Update").click();

    cy.contains("button", "Show Status").click();
    cy.contains("button", "Edit Application").click();
    cy.get('input[placeholder="Enter the email used for this application"]')
      .type(`attendee.${unique}@example.com`);
    cy.contains("button", "Continue").click();
    cy.contains("h6", "Dietary notes")
      .closest(".MuiStack-root")
      .find("input[type=\"text\"]")
      .first()
      .should("have.value", "No nuts please");
  });
});
export {};
