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

describe("Meet visibility - organizer", () => {
  it("lets Bob see Alice's Summit meets in read-only mode without organisation admin access", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').first().type("bob@nowhere.com");
    cy.get('input[type="password"]').first().type("Password123!");
    cy.contains("button", "Login").click();

    cy.contains("Dashboard").should("be.visible");
    switchToAllMeets();
    getDashboardMeetCard("Day Hike Meet").as("aliceMeetRow");

    cy.get("@aliceMeetRow").should("be.visible").click();
    cy.contains("Day Hike Meet").should("be.visible");
    cy.get('button[aria-label="Close meet details"]').click();

    cy.get("@aliceMeetRow").within(() => {
      cy.get('svg[data-testid="MoreVertIcon"]').parent("button").click();
    });

    cy.contains("Meet details").should("be.visible");
    cy.contains('[role="menuitem"]', "Edit").should("be.visible");
    cy.contains('[role="menuitem"]', "Attendees").should(
      "have.attr",
      "aria-disabled",
      "true",
    );
    cy.contains('[role="menuitem"]', "Re-open meet").should(
      "have.attr",
      "aria-disabled",
      "true",
    );
    cy.contains('[role="menuitem"]', "Edit").click();
    cy.contains("Edit meet").should("be.visible");
    cy.get('[aria-label="Meet locked"]').should("be.visible");
    cy.get('button[aria-label="Unlock meet"]').should("not.exist");
    cy.get('input[placeholder="Give your meet a name"]').should("be.disabled");
    cy.get('textarea[placeholder="Describe your meet in detail here"]').should(
      "be.disabled",
    );
    cy.get('svg[data-testid="CloseIcon"]').last().parent("button").click();
    cy.contains("Edit meet").should("not.exist");

    cy.get('[data-testid="account-menu-button"]').click();
    cy.get('[role="menu"]').should("be.visible");
    cy.contains('[role="menuitem"]', "Organisation").should("not.exist");
  });
});
