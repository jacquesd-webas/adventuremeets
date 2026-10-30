export {};

describe("Meet signup with count-only guests", () => {
  it("accepts a guest count without showing guest invite actions", () => {
    const unique = Date.now();
    const meetName = `Count-only Guests Meet ${unique}`;
    const hostName = "Guest Host";

    cy.visit("/login");
    cy.get('input[type="email"]').type("bob@nowhere.com");
    cy.get('input[type="password"]').type("Password123!");
    cy.contains("button", "Login").click();
    cy.url().should("match", /\/$/);

    cy.createMinimalMeet({
      meetName,
      allowGuests: true,
      namedGuests: false,
      maxGuests: 2,
    }).as("shareLink");

    cy.get('[data-testid="account-menu-button"]').click();
    cy.contains("Logout").click();
    cy.intercept("POST", "**/meets/*/attendees").as("createAttendee");

    cy.get("@shareLink").then((shareLink) => {
      cy.wait(11000);
      cy.visit(String(shareLink));
      cy.get('input[placeholder="Your name"]').type(hostName);
      cy.get('input[placeholder="you@example.com"]').type(
        `count.host.${unique}@example.com`,
      );
      cy.get('input[placeholder="Mobile phone number"]').type(
        `555${Math.floor(1000000 + Math.random() * 9000000)}`,
      );
      cy.contains("I would like to bring guests")
        .parent()
        .find('input[type="checkbox"]')
        .check({ force: true });
      cy.contains("Number of guests")
        .parent()
        .find('input[type="number"]')
        .type("2");
      cy.contains("Guest 1 name").should("not.exist");
      cy.contains("button", "+ Add guest").should("not.exist");

      cy.contains("button", "Submit application").click();
      cy.contains("Application submitted").should("be.visible");
      cy.wait("@createAttendee").then((interception) => {
        expect(interception.request.body.guests).to.equal(2);
        expect(interception.request.body.guestsList).to.deep.equal([]);
        expect(interception.response?.body?.attendee?.guests).to.equal(2);
        expect(interception.response?.body?.attendee?.guestsList).to.deep.equal(
          [],
        );
      });

      cy.contains("Guest Information").should("not.exist");
      cy.contains("Send invite").should("not.exist");
      cy.contains("Copy link").should("not.exist");
    });
  });
});
