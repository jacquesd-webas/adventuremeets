describe("Login - multi org", () => {
  it("shows organization picker for Alice", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').first().type("alice@nowhere.com");
    cy.get('input[type="password"]').first().type("Password123!");
    cy.contains("button", "Login").click();

    cy.contains("Choose organisation").should("be.visible");
    cy.contains("Select the organization you want to work with.").should(
      "be.visible",
    );

    cy.get("#organization-select-label").should("be.visible");
    cy.get('[role="combobox"]').click();
    cy.get('[role="listbox"] [role="option"]')
      .should("have.length.greaterThan", 1);
    cy.get('[role="listbox"] [role="option"]').first().click();
    cy.contains("button", "Choose").click();

    cy.contains("Choose organisation").should("not.exist");
    cy.url().should("match", /\/$/);
    cy.contains("Dashboard").should("be.visible");
    cy.contains("button", "Summit Explorers").should("be.visible");
    cy.get('[data-testid="organization-switcher-button"]').should("be.visible");
  });
});
