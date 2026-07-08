const openOrganizationModal = () => {
  cy.get('[data-testid="account-menu-button"]').click();
  cy.get('[role="menu"]').should("be.visible");
  cy.contains('[role="menuitem"]', "Organisation").click();
  cy.get('[data-testid="organization-modal"]').should("be.visible");
};

const openOrganizationSection = (label: string) => {
  cy.get('[data-testid="organization-modal"]').contains(label).click();
};

describe("Meet signup custom fields", () => {
  it("configures organisation fields and submits org1/org2 values during signup", () => {
    const unique = Date.now();
    const password = "Str0ng!Passw0rd2026";
    const organizerEmail = `cypress.org.signup.${unique}@example.com`;
    const attendeeEmail = `cypress.attendee.${unique}@example.com`;
    const meetName = `Org Custom Fields Meet ${unique}`;
    const clubValue = `Club ${unique}`;
    const teamValue = `Team ${unique}`;

    cy.intercept("POST", "**/api/v1/meets/*/attendees").as("createAttendee");

    cy.visit("/register");
    cy.registerWithEmail({
      firstName: "Cypress",
      lastName: "Organizer",
      phone: "5550001111",
      email: organizerEmail,
      password,
    });
    cy.url().should("match", /\/$/);
    cy.contains("Dashboard").should("be.visible");

    openOrganizationModal();
    openOrganizationSection("Fields");

    cy.contains("label", "Custom field 1 name")
      .parent()
      .find("input")
      .clear()
      .type("Club");
    cy.contains("label", "Custom field 2 name")
      .parent()
      .find("input")
      .clear()
      .type("Team");
    cy.contains("label", "Custom field 1 preview text")
      .parent()
      .find("input")
      .clear()
      .type("Enter your club");
    cy.contains("label", "Custom field 2 preview text")
      .parent()
      .find("input")
      .clear()
      .type("Enter your team");
    cy.contains("button", "Save field names").click();
    cy.contains("button", "Saved").should("be.visible");

    cy.get('[data-testid="close-organization-modal"]').click();
    cy.get('[data-testid="organization-modal"]').should("not.exist");

    cy.createMinimalMeet({
      meetName,
      description: "Short description for custom fields signup test.",
      requiredStandardFields: ["Club", "Team"],
    }).as("shareLink");

    cy.logout();

    cy.get("@shareLink").then((shareLink) => {
      cy.visit(String(shareLink));
      cy.wait(11000);
      cy.visit(String(shareLink));
    });

    cy.get('input[placeholder="Your name"]').clear().type("Signup Attendee");
    cy.get('input[placeholder="you@example.com"]').clear().type(attendeeEmail);
    cy.get('input[placeholder="Mobile phone number"]').clear().type("5551234567");
    cy.get('input[aria-label="Club"]')
      .should("have.attr", "placeholder", "Enter your club")
      .type(clubValue);
    cy.get('input[aria-label="Team"]')
      .should("have.attr", "placeholder", "Enter your team")
      .type(teamValue);
    cy.contains("button", "Submit application").click();

    cy.wait("@createAttendee")
      .its("request.body")
      .should("include", {
        org1Value: clubValue,
        org2Value: teamValue,
      });

    cy.contains("Application submitted").should("be.visible");
  });
});

export {};
