describe("Login - single org", () => {
  it("logs in without showing org picker for Bob", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').first().type("bob@nowhere.com");
    cy.get('input[type="password"]').first().type("Password123!");
    cy.contains("button", "Login").click();

    cy.contains("Choose organisation").should("not.exist");
    cy.url().should("match", /\/$/);
    cy.contains("Dashboard").should("be.visible");
    cy.get('[data-testid="organization-switcher-button"]').should("not.exist");
  });
});
