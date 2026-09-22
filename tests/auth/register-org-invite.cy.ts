describe("Register with organisation invite", () => {
  it("registers a new member into Summit Explorers via the org register link", () => {
    const unique = Date.now();
    const email = `cypress.org.register.${unique}@example.com`;
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

    cy.get("@summitOrgId").then((summitOrgId) => {
      cy.visit(`/register?org=${encodeURIComponent(String(summitOrgId))}`);
    });

    cy.contains("Invalid organisation invitation link").should("not.exist");

    cy.registerWithEmail({
      firstName: "Cypress",
      lastName: "SummitMember",
      phone: "5550003333",
      email,
      password,
    });

    cy.url().should("match", /\/$/);
    cy.contains("Dashboard").should("be.visible");
    cy.get('[data-testid="organization-switcher-button"]').should("not.exist");

    cy.openProfileModal();
    cy.get('[data-testid="profile-modal"]')
      .contains("Organisations")
      .closest('[role="button"]')
      .click();
    cy.contains("Summit Explorers").should("be.visible");
  });
});
