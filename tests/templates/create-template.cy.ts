describe("Create template", () => {
  it("registers, makes org public, and creates a template", () => {
    const unique = Date.now();
    const email = `cypress.template.${unique}@example.com`;

    cy.visit("/register");
    cy.contains("Continue with Email").click();

    cy.get('input[type="text"]').first().type("Cypress");
    cy.get('input[type="text"]').eq(1).type("Template");
    cy.get('input[placeholder="Mobile phone number"]').type("5550001111");
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type("Str0ng!Passw0rd2026");

    cy.contains("button", "Create account").click();
    cy.url().should("match", /\/$/);

    cy.get(".MuiAvatar-root").first().click();
    cy.get('[role="menu"]').contains("Profile").click();

    cy.contains("Organisation").click();
    cy.contains("Allow users to join with invite link")
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("button", "Save organization").click();

    cy.contains("label", "Invite link")
      .parent()
      .find("input")
      .invoke("val")
      .then((value) => {
        expect(value).to.contain("/register?org=");
        cy.wrap(value).as("inviteLink");
      });

    cy.get("@inviteLink").then((inviteLink) => {
      const orgId = new URL(inviteLink as unknown as string).searchParams.get(
        "org",
      );
      expect(orgId).to.be.a("string").and.not.be.empty;
      cy.visit(`/admin/organizations/${orgId}/templates`);
    });

    cy.contains("button", "Create template").click();

    cy.contains("label", "Name")
      .parent()
      .find("input")
      .type(`Template ${unique}`);
    cy.contains("label", "Description")
      .parent()
      .find("input")
      .type("Template description");

    cy.contains("Questions").click();

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
      .type("Bring extra water?");
    cy.get('input[placeholder="What should the user see?"]')
      .eq(3)
      .type("Agree to leave no trace?");

    cy.get('[data-testid="create-template-submit"]')
      .scrollIntoView()
      .click();
  });
});

export {};
