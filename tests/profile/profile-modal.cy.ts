describe("Profile modal", () => {
  it("updates personal details, emergency info, and avatar", () => {
    const unique = Date.now();
    const email = `cypress.profile.${unique}@example.com`;
    const initialPhone = "5550001111";
    const updatedPhone = "5550002222";
    const avatarSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
        <rect width="64" height="64" fill="#0f766e" />
        <circle cx="32" cy="32" r="18" fill="#f8fafc" />
      </svg>
    `;

    cy.visit("/register");
    cy.contains("Continue with Email").click();

    cy.get('input[type="text"]').first().type("Cypress");
    cy.get('input[type="text"]').eq(1).type("Profile");
    cy.get('input[placeholder="Mobile phone number"]').type(initialPhone);
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type("Str0ng!Passw0rd2026");

    cy.contains("button", "Create account").click();
    cy.url().should("match", /\/$/);
    cy.contains("Dashboard").should("be.visible");

    cy.get('[data-testid="account-menu-button"]').click();
    cy.get('[role="menu"]').should("be.visible");
    cy.get('[data-testid="account-profile-menu-item"]').click();
    cy.get('[data-testid="profile-modal"]').should("be.visible");

    cy.contains("label", "First name")
      .parent()
      .find("input")
      .clear()
      .type("Updated");
    cy.contains("label", "Last name")
      .parent()
      .find("input")
      .clear()
      .type("Person");
    cy.get('input[placeholder="Mobile phone number"]')
      .first()
      .clear()
      .type(updatedPhone);
    cy.contains("button", "Save personal details").click();
    cy.contains("button", "Saved").should("be.visible");

    cy.contains("Emergency Info").click();
    cy.contains("label", "Emergency contact name")
      .parent()
      .find("input")
      .type("Morgan Contact");
    cy.get('input[placeholder="Mobile phone number"]').eq(1).type("5550003333");
    cy.contains("label", "Medical aid")
      .parent()
      .find("input")
      .type("Discovery");
    cy.contains("label", "Medical aid number")
      .parent()
      .find("input")
      .type("MA-123456");
    cy.get('input[type="date"]').type("1990-04-12");
    cy.contains("label", "Medical history")
      .parent()
      .find("textarea")
      .type("Asthma and peanut allergy");
    cy.contains("button", "Save emergency info").click();
    cy.contains("button", "Saved").should("be.visible");

    cy.contains("Avatar").click();
    cy.contains("button", "Choose file")
      .find('input[type="file"]')
      .selectFile(
        {
          contents: Cypress.Buffer.from(avatarSvg),
          fileName: "avatar.svg",
          mimeType: "image/svg+xml",
          lastModified: Date.now(),
        },
        { force: true },
      );
    cy.contains("Avatar saved").should("be.visible");

    cy.get('[data-testid="close-profile-modal"]').click();
    cy.get('[data-testid="profile-modal"]').should("not.exist");

    cy.get('[data-testid="account-menu-button"]').click();
    cy.get('[role="menu"]').should("be.visible");
    cy.get('[data-testid="account-profile-menu-item"]').click();
    cy.get('[data-testid="profile-modal"]').should("be.visible");

    cy.contains("label", "First name")
      .parent()
      .find("input")
      .should("have.value", "Updated");
    cy.contains("label", "Last name")
      .parent()
      .find("input")
      .should("have.value", "Person");
    cy.get('input[placeholder="Mobile phone number"]')
      .first()
      .should("have.value", updatedPhone);

    cy.contains("Emergency Info").click();
    cy.contains("label", "Emergency contact name")
      .parent()
      .find("input")
      .should("have.value", "Morgan Contact");
    cy.contains("label", "Medical aid")
      .parent()
      .find("input")
      .should("have.value", "Discovery");
    cy.contains("label", "Medical aid number")
      .parent()
      .find("input")
      .should("have.value", "MA-123456");
    cy.contains("label", "Medical history")
      .parent()
      .find("textarea")
      .should("have.value", "Asthma and peanut allergy");

    cy.contains("Avatar").click();
    cy.get('[data-testid="profile-modal"] .MuiAvatar-root img')
      .should("have.attr", "src")
      .and("include", "/avatars/");
  });
});
