describe("Login with invite", () => {
  it("logs an existing user in from the Summit Explorers org link and joins that organisation", () => {
    const unique = Date.now();
    const email = `cypress.org.login.${unique}@example.com`;
    const password = "Str0ng!Passw0rd2026";

    cy.visit("/login");

    cy.get('input[type="email"]').first().type("alice@nowhere.com");
    cy.get('input[type="password"]').first().type("Password123!");
    cy.contains("button", "Login").click();

    cy.contains("Choose organisation").should("be.visible");
    cy.get('[role="combobox"]').click();
    cy.contains('[role="option"]', "Summit Explorers").click();
    cy.contains("button", "Choose").click();

    cy.contains("Dashboard").should("be.visible");
    cy.contains("button", "Summit Explorers").should("be.visible");

    cy.window().then((win) => {
      const organizationId = win.localStorage.getItem("currentOrganizationId");
      expect(organizationId, "Summit Explorers org id").to.be.a("string").and
        .not.be.empty;
      cy.wrap(String(organizationId)).as("summitOrgId");
    });

    cy.logout();

    cy.visit("/register");
    cy.registerWithEmail({
      firstName: "Cypress",
      lastName: "ExistingUser",
      phone: "5550005555",
      email,
      password,
    });

    cy.url().should("match", /\/$/);
    cy.contains("Dashboard").should("be.visible");
    cy.logout();

    cy.get("@summitOrgId").then((summitOrgId) => {
      cy.visit(`/register?org=${encodeURIComponent(String(summitOrgId))}`);
    });

    cy.contains("Invalid organisation invitation link").should("not.exist");
    cy.contains("a", "Already have an account?").click();

    cy.get('input[type="email"]').first().type(email);
    cy.get('input[type="password"]').first().type(password);
    cy.contains("button", "Login").click();

    cy.url().should("match", /\/$/);
    cy.contains("Dashboard").should("be.visible");

    cy.openProfileModal();
    cy.get('[data-testid="profile-modal"]')
      .contains("Organisations")
      .closest('[role="button"]')
      .click();
    cy.contains("Summit Explorers").should("be.visible");
  });
});
