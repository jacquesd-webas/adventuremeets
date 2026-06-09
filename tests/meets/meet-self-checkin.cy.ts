export {};

describe("Meet self check-in", () => {
  it("lets an accepted attendee self check in from the public check-in link", () => {
    const unique = Date.now();
    const meetName = `Self Checkin Meet ${unique}`;
    const attendee = {
      name: `Self Checkin Attendee ${unique}`,
      email: `self.checkin.${unique}@example.com`,
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    };

    const openMeetRowMenu = () => {
      cy.contains(meetName)
        .scrollIntoView()
        .parents('[role="row"]')
        .first()
        .within(() => {
          cy.get('svg[data-testid="MoreVertIcon"]').parent("button").click();
        });
    };

    cy.visit("/login");
    cy.get('input[type="email"]').type("bob@nowhere.com");
    cy.get('input[type="password"]').type("Password123!");
    cy.contains("button", "Login").click();
    cy.url().should("match", /\/$/);

    cy.createMinimalMeet({
      meetName,
      description: "Short description for self check-in test.",
      allowSelfCheckin: true,
    }).as("shareLink");

    cy.logout();

    cy.get("@shareLink").then((shareLink) => {
      cy.wait(11000);
      cy.visit(shareLink as unknown as string);
      cy.get('input[placeholder="Your name"]').clear().type(attendee.name);
      cy.get('input[placeholder="you@example.com"]').clear().type(attendee.email);
      cy.get('input[placeholder="Mobile phone number"]')
        .clear()
        .type(attendee.phone);
      cy.contains("button", "Submit application").click();
      cy.contains("Application submitted").should("be.visible");
    });

    cy.visit("/login");
    cy.get('input[type="email"]').type("bob@nowhere.com");
    cy.get('input[type="password"]').type("Password123!");
    cy.contains("button", "Login").click();
    cy.contains("Dashboard").should("be.visible");

    cy.visit("/plan");
    openMeetRowMenu();
    cy.contains("Attendees").click();
    cy.contains('[role="button"]', attendee.name).click();
    cy.contains("button", "Accept").click();
    cy.get('[data-testid="close-attendees-modal"]').click();
    cy.contains("Notify attendees?").should("be.visible");
    cy.contains("button", "Later").click();

    openMeetRowMenu();
    cy.contains("Close meet").click();
    cy.contains("button", "Close meet").click();

    openMeetRowMenu();
    cy.contains("Check-in").click();
    cy.get('[aria-label="Show self check-in QR code"]').click();
    cy.contains("Self check-in QR code").should("be.visible");
    cy.contains("/meets/")
      .invoke("text")
      .then((selfCheckinUrl) => {
        cy.wrap(selfCheckinUrl.trim()).as("selfCheckinUrl");
      });

    cy.get("@selfCheckinUrl").then((selfCheckinUrl) => {
      cy.visit(String(selfCheckinUrl));
    });

    cy.contains(`${meetName} - Check-in`).should("be.visible");
    cy.get('input[placeholder="Your name"]').clear().type(attendee.name);
    cy.get('input[placeholder="you@example.com"]').clear().type(attendee.email);

    cy.contains("Found a match, ready to check in.").should("be.visible");
    cy.contains("button", "Check in").should("be.enabled").click();

    cy.url().should("match", /\/meets\/[^/]+\/[^/]+$/);
  });
});
