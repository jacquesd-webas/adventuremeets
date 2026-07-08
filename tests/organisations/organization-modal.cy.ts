const openOrganizationModal = () => {
  cy.get('[data-testid="account-menu-button"]').click();
  cy.get('[role="menu"]').should("be.visible");
  cy.contains('[role="menuitem"]', "Organisation").click();
  cy.get('[data-testid="organization-modal"]').should("be.visible");
};

const openOrganizationSection = (label: string) => {
  cy.get('[data-testid="organization-modal"]').contains(label).click();
};

const registerOrganizationAdmin = (email: string) => {
  cy.visit("/register");
  cy.registerWithEmail({
    firstName: "Cypress",
    lastName: "OrgAdmin",
    phone: "5550001111",
    email,
    password: "Str0ng!Passw0rd2026",
  });
  cy.url().should("match", /\/$/);
  cy.contains("Dashboard").should("be.visible");
};

describe("Organisation modal", () => {
  it("renames an organisation, saves field names, and uploads a logo", () => {
    const unique = Date.now();
    const email = `cypress.org.modal.${unique}@example.com`;
    const organizationName = `Renamed Org ${unique}`;
    const logoSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
        <rect width="64" height="64" rx="12" fill="#1d4ed8" />
        <circle cx="32" cy="32" r="16" fill="#f8fafc" />
      </svg>
    `;

    registerOrganizationAdmin(email);
    openOrganizationModal();

    cy.contains("label", "Organisation name")
      .parent()
      .find("input")
      .clear()
      .type(organizationName);
    cy.contains("button", "Save organisation").click();
    cy.contains("button", "Saved").should("be.visible");

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
    cy.contains("button", "Save field names").click();
    cy.contains("button", "Saved").should("be.visible");

    openOrganizationSection("Theme");
    cy.get('[data-testid="organization-logo-input"]').selectFile(
      {
        contents: Cypress.Buffer.from(logoSvg),
        fileName: "organization-logo.svg",
        mimeType: "image/svg+xml",
        lastModified: Date.now(),
      },
      { force: true },
    );
    cy.contains("Logo saved").should("be.visible");

    cy.get('[data-testid="close-organization-modal"]').click();
    cy.get('[data-testid="organization-modal"]').should("not.exist");

    openOrganizationModal();
    cy.contains("label", "Organisation name")
      .parent()
      .find("input")
      .should("have.value", organizationName);
    openOrganizationSection("Fields");
    cy.contains("label", "Custom field 1 name")
      .parent()
      .find("input")
      .should("have.value", "Club");
    cy.contains("label", "Custom field 2 name")
      .parent()
      .find("input")
      .should("have.value", "Team");
    openOrganizationSection("Theme");
    cy.get('[alt="Organisation logo preview"]')
      .should("have.attr", "src")
      .and("include", "/logos/");
  });
});
