describe("Register", () => {
  it("shows weak password strength and disables submit", () => {
    const unique = Date.now();
    const email = `cypress.weak.${unique}@example.com`;

    cy.visit("/register");
    cy.contains("Continue with Email").click();

    cy.get('input[type="text"]').first().type("Cypress");
    cy.get('input[type="text"]').eq(1).type("Weak");
    cy.get('input[placeholder="Mobile phone number"]').type("5550001111");
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type("weak");

    cy.contains("Password strength").should("be.visible");
    cy.contains("Weak").should("be.visible");
    cy.contains("button", "Create account").should("be.disabled");
  });

  it("shows email validation error for invalid email", () => {
    cy.visit("/register");
    cy.contains("Continue with Email").click();

    cy.get('input[type="text"]').first().type("Cypress");
    cy.get('input[type="text"]').eq(1).type("InvalidEmail");
    cy.get('input[placeholder="Mobile phone number"]').type("5550001111");
    cy.get('input[type="email"]').type("not-an-email").blur();

    cy.contains("Enter a valid email").should("be.visible");
    cy.contains("button", "Create account").should("be.disabled");
  });

  it("requires all fields before enabling submit", () => {
    const unique = Date.now();
    const email = `cypress.partial.${unique}@example.com`;

    cy.visit("/register");
    cy.contains("Continue with Email").click();

    cy.contains("button", "Create account").should("be.disabled");

    cy.get('input[type="text"]').first().type("Cypress");
    cy.get('input[type="text"]').eq(1).type("MissingFields");
    cy.contains("button", "Create account").should("be.disabled");

    cy.get('input[placeholder="Mobile phone number"]').type("5550001111");
    cy.contains("button", "Create account").should("be.disabled");

    cy.get('input[type="email"]').type(email);
    cy.contains("button", "Create account").should("be.disabled");

    cy.get('input[type="password"]').type("Str0ng!Passw0rd2026");
    cy.contains("button", "Create account").should("not.be.disabled");
  });

  it("registers a new account and shows personal details", () => {
    const unique = Date.now();
    const email = `cypress.user.${unique}@example.com`;

    cy.visit("/register");
    cy.contains("Continue with Email").click();

    cy.get('input[type="text"]').first().type("Cypress");
    cy.get('input[type="text"]').eq(1).type("User");
    cy.get('input[placeholder="Mobile phone number"]').type("5550001111");
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type("Str0ng!Passw0rd2026");

    cy.contains("button", "Create account").click();
    cy.url().should("match", /\/$/);
    cy.contains("Dashboard").should("be.visible");

    cy.get(".MuiAvatar-root").first().click();
    cy.contains("Profile").click();

    cy.contains("label", "First name")
      .parent()
      .find("input")
      .should("have.value", "Cypress");
    cy.contains("label", "Last name")
      .parent()
      .find("input")
      .should("have.value", "User");
  });
});
