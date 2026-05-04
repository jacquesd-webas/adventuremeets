type RegisterWithEmailOptions = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
};

declare global {
  namespace Cypress {
    interface Chainable {
      registerWithEmail(options: RegisterWithEmailOptions): Chainable<void>;
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
