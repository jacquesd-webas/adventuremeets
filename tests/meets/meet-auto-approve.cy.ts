export {};

describe("Meet auto approval", () => {
  it("auto-places applicants into confirmed, waitlisted, and rejected states based on capacity", () => {
    const unique = Date.now();
    const organizerEmail = "bob@nowhere.com";
    const organizerPassword = "Password123!";
    const meetName = `Bob Auto Approve Meet ${unique}`;
    const applicants = [
      {
        name: "Auto Approve Attendee 1",
        email: `auto.approve.${unique}.1@example.com`,
        expectedApiStatus: "confirmed",
        expectedStatusLabel: "Confirmed",
      },
      {
        name: "Auto Approve Attendee 2",
        email: `auto.approve.${unique}.2@example.com`,
        expectedApiStatus: "confirmed",
        expectedStatusLabel: "Confirmed",
      },
      {
        name: "Auto Approve Attendee 3",
        email: `auto.approve.${unique}.3@example.com`,
        expectedApiStatus: "waitlisted",
        expectedStatusLabel: "Waitlisted",
      },
      {
        name: "Auto Approve Attendee 4",
        email: `auto.approve.${unique}.4@example.com`,
        expectedApiStatus: "rejected",
        expectedStatusLabel: "Not selected",
      },
    ].map((applicant, index) => ({
      ...applicant,
      phone: `555${Math.floor(1000000 + Math.random() * 9000000) + index}`,
    }));

    cy.intercept("POST", "**/api/v1/meets/*/attendees").as("createAttendee");

    cy.visit("/login");
    cy.get('input[type="email"]').type(organizerEmail);
    cy.get('input[type="password"]').type(organizerPassword);
    cy.contains("button", "Login").click();
    cy.url().should("match", /\/$/);

    cy.createMinimalMeet({
      meetName,
      description: "Short description for auto approve test.",
      capacity: 3,
      waitlistSize: 1,
      autoApprove: true,
    }).as("shareLink");

    cy.logout();
    cy.wait(11000);

    cy.get("@shareLink").then((shareLink) => {
      applicants.forEach((applicant) => {
        cy.visit(shareLink as unknown as string);
        cy.get('input[placeholder="Your name"]').clear().type(applicant.name);
        cy.get('input[placeholder="you@example.com"]')
          .clear()
          .type(applicant.email);
        cy.get('input[placeholder="Mobile phone number"]')
          .clear()
          .type(applicant.phone);
        cy.contains("button", "RSVP").click();

        cy.wait("@createAttendee").then((interception) => {
          expect(interception.response?.statusCode).to.eq(201);
          expect(interception.response?.body?.attendee?.status).to.eq(
            applicant.expectedApiStatus,
          );
        });

        cy.contains("RSVP submitted").should("be.visible");
        cy.contains("button", "Show Status").click();
        cy.contains("Your status").should("be.visible");
        cy.contains("h4", applicant.expectedStatusLabel).should("be.visible");
        cy.get('[data-testid="close-attendee-status"]').click();
      });
    });
  });
});
