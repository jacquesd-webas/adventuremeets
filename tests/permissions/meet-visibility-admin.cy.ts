export {};

const chooseOrganization = (name: string) => {
  cy.get('[data-testid="organization-switcher-button"]')
    .filter(":visible")
    .scrollIntoView()
    .should("be.visible")
    .click();

  cy.contains("Choose organisation").should("be.visible");
  cy.get('[role="dialog"], [role="presentation"]')
    .filter(":visible")
    .last()
    .within(() => {
      cy.get('[role="combobox"]').click();
    });

  cy.contains('[role="option"]', name).click();

  cy.get('[role="dialog"], [role="presentation"]')
    .filter(":visible")
    .last()
    .contains("button", "Choose")
    .click();

  cy.contains("Choose organisation").should("not.exist");
};

const searchMeet = (name: string) => {
  cy.get("body").then(($body) => {
    if ($body.find('button[aria-label="Search meets"]').length) {
      cy.get('button[aria-label="Search meets"]').click();
    }
  });
  cy.get('input[placeholder="Search meets"]').clear().type(name);
  cy.wait(600);
};

const getDashboardMeetCard = (name: string) => {
  searchMeet(name);
  return cy
    .get('[data-testid="dashboard-scroll-container"]')
    .contains("h6", name)
    .closest(".MuiPaper-root");
};

const openMeetRowMenu = (name: string) => {
  getDashboardMeetCard(name).as("meetCard");
  cy.get("@meetCard").within(() => {
    cy.get('svg[data-testid="MoreVertIcon"]').parent("button").click();
  });
};

describe("Meet visibility - admin", () => {
  it("lets Alice see both organisations and the seeded Summit meets", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').first().type("alice@nowhere.com");
    cy.get('input[type="password"]').first().type("Password123!");
    cy.contains("button", "Login").click();

    cy.contains("Choose organisation").should("be.visible");
    cy.get('[role="combobox"]').click();
    cy.contains('[role="option"]', "Summit Explorers").click();
    cy.contains("button", "Choose").click();

    cy.contains("Dashboard").should("be.visible");
    cy.get('[data-testid="organization-switcher-button"]').should("be.visible");
    getDashboardMeetCard("Day Hike Meet").should("be.visible");
    getDashboardMeetCard("Caving Meet").should("be.visible");

    cy.openProfileModal();
    cy.get('[data-testid="profile-modal"]')
      .contains("Organisations")
      .closest('[role="button"]')
      .click();
    cy.get('[data-testid="profile-modal"]')
      .contains("Summit Explorers")
      .should("be.visible");
    cy.get('[data-testid="profile-modal"]')
      .contains("Trailblazers Club")
      .should("be.visible");
    cy.closeProfileModal();

    chooseOrganization("Trailblazers Club");
    cy.contains("Dashboard").should("be.visible");

    chooseOrganization("Summit Explorers");
    getDashboardMeetCard("Day Hike Meet").should("be.visible");
    getDashboardMeetCard("Caving Meet").should("be.visible");

    openMeetRowMenu("Caving Meet");
    cy.contains("Edit").click();
    cy.contains("Edit meet").should("be.visible");
    cy.get('button[aria-label="Unlock meet"]').click();
    cy.get('input[placeholder="Give your meet a name"]').should(
      "have.value",
      "Caving Meet",
    );
    cy.get('textarea[placeholder="Describe your meet in detail here"]')
      .clear()
      .type("Temporary admin edit that should be discarded.");
    cy.get('svg[data-testid="CloseIcon"]').last().parent("button").click();
    cy.contains("Discard changes?").should("be.visible");
    cy.contains(
      "You have unsaved changes. Leaving this step will discard them.",
    ).should("be.visible");
    cy.contains("button", "Discard").click();
    cy.contains("Edit meet").should("not.exist");

    openMeetRowMenu("Caving Meet");
    cy.contains("Attendees").click();
    cy.contains("All Attendees").should("be.visible");
    cy.get('[data-testid="close-attendees-modal"]').click();

    openMeetRowMenu("Caving Meet");
    cy.contains("Close meet").click();
    cy.contains("Close meet?").should("be.visible");
    cy.contains(
      "You are making admin-level changes to someone else's meet.",
    ).should("be.visible");
    cy.contains("button", "Cancel").click();
    cy.contains("Close meet?").should("not.exist");
  });
});
