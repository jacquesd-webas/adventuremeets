describe("Meet signup duplicate", () => {
  it("creates a meet and handles duplicate signup", () => {
    const unique = Date.now();
    const email = `cypress.dup.${unique}@example.com`;
    const attendeeEmail = `attendee.${unique}@example.com`;
    const meetName = `Signup Meet ${unique}`;
    const description = "Short description for signup test.";

    cy.visit("/register");
    cy.registerWithEmail({
      firstName: "Cypress",
      lastName: "Duplicate",
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
      email,
      password: "Str0ng!Passw0rd2026",
    });
    cy.url().should("match", /\/$/);

    cy.createMinimalMeet({
      meetName,
      description,
      requireIndemnity: true,
      includeQuestions: true,
    }).as("shareLink");

    cy.get('[data-testid="account-menu-button"]').click();
    cy.contains("Logout").click();

    cy.get("@shareLink").then((shareLink) => {
      cy.visit(shareLink as unknown as string);
      cy.wait(20000);
      cy.visit(shareLink as unknown as string);
    });

    cy.get('input[placeholder="Your name"]').type("Signup User");
    cy.get('input[placeholder="you@example.com"]').type(attendeeEmail);
    cy.get('input[placeholder="Mobile phone number"]').type(
      `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    );
    cy.contains("h6", "Dietary notes")
      .closest(".MuiStack-root")
      .find('input[type="text"]')
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

    // Sign up again with the same email to test duplicate handling
    cy.get("@shareLink").then((shareLink) => {
      cy.visit(shareLink as unknown as string);
    });

    cy.get('input[placeholder="Your name"]').type("Signup User");
    cy.get('input[placeholder="you@example.com"]').type(attendeeEmail);
    cy.get('input[placeholder="Mobile phone number"]').type(
      `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    );
    cy.contains("Already signed up").should("be.visible");
  });
});
export {};
