export {};

const switchToAllMeets = () => {
  cy.contains("button", /^All meets$|^ALL$/).click();
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

describe("Meet visibility - member", () => {
  it("lets a normal member see Summit meets in read-only mode without organisation admin access", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').first().type("dave@nowhere.com");
    cy.get('input[type="password"]').first().type("Password123!");
    cy.contains("button", "Login").click();

    cy.contains("Dashboard").should("be.visible");
    switchToAllMeets();
    getDashboardMeetCard("Day Hike Meet").as("summitMeetRow");

    cy.get("@summitMeetRow").should("be.visible").click();
    cy.contains("Day Hike Meet").should("be.visible");
    cy.get('button[aria-label="Close meet details"]').click();

    cy.get("@summitMeetRow").within(() => {
      cy.get('svg[data-testid="MoreVertIcon"]').parent("button").click();
    });

    cy.contains("Edit").should("not.exist");
    cy.contains("Attendees").should("not.exist");
    cy.contains("Close meet").should("not.exist");
    cy.contains("Meet details").should("be.visible").click();

    cy.contains("Skyline Ridge Trailhead");

    cy.get('[data-testid="close-meet-details"]').click();

    cy.get('[data-testid="account-menu-button"]').click();
    cy.get('[role="menu"]').should("be.visible");
    cy.contains('[role="menuitem"]', "Organisation").should("not.exist");
  });
});
