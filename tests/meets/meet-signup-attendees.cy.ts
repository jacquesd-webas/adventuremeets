export {};

describe("Meet signup with Bob", () => {
  it("creates a meet and signs up five attendees", () => {
    const unique = Date.now();
    const meetName = `Bob Signup Meet ${unique}`;
    const description = "Short description for bob signup test.";

    cy.visit("/login");
    cy.get('input[type="email"]').type("bob@nowhere.com");
    cy.get('input[type="password"]').type("Password123!");
    cy.contains("button", "Login").click();
    cy.url().should("match", /\/$/);

    cy.createMinimalMeet({
      meetName,
      description,
    }).as("shareLink");

    cy.get('[data-testid="account-menu-button"]').click();
    cy.contains("Logout").click();

    const attendees = Array.from({ length: 5 }, (_, index) => ({
      name: `Attendee ${index + 1}`,
      email: `attendee.${unique}.${index + 1}@example.com`,
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    }));

    cy.get("@shareLink").then((shareLink) => {
      cy.wait(11000);
      attendees.forEach((attendee) => {
        cy.visit(shareLink as unknown as string);
        cy.get('input[placeholder="Your name"]').clear().type(attendee.name);
        cy.get('input[placeholder="you@example.com"]')
          .clear()
          .type(attendee.email);
        cy.get('input[placeholder="Mobile phone number"]')
          .clear()
          .type(attendee.phone);
        cy.contains("button", "Submit application").click();
        cy.contains("Application submitted").should("be.visible");
      });
    });

    cy.visit("/login");
    cy.get('input[type="email"]').type("bob@nowhere.com");
    cy.get('input[type="password"]').type("Password123!");
    cy.contains("button", "Login").click();
    cy.contains("Dashboard").should("be.visible");
    cy.visit("/plan");
    cy.contains(meetName)
      .scrollIntoView()
      .parents('[role="row"]')
      .first()
      .as("createdMeetRow");
    cy.get("@createdMeetRow").should("be.visible");

    cy.get("@createdMeetRow").within(() => {
      cy.get('svg[data-testid="MoreVertIcon"]').parent("button").click();
    });
    cy.contains("Attendees").click();

    attendees.forEach((attendee) => {
      cy.contains(attendee.name).scrollIntoView().should("be.visible");
    });

    cy.contains("button", "Close").click();
  });
});
