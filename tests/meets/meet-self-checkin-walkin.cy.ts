export {};

describe("Meet self check-in with walk-ins", () => {
  it("matches by email, phone, and name, and checks in an unknown walk-in", () => {
    const unique = Date.now();
    const meetName = `Bob Walk-in Meet ${unique}`;
    const attendee = {
      name: `Attendee ${unique}`,
      email: `attendee.selfcheckin.${unique}@example.com`,
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    };
    const rejectedAttendee = {
      name: `Rejected Attendee ${unique}`,
      email: `attendee.rejected.${unique}@example.com`,
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    };
    const unknownAttendee = {
      name: `Unknown Attendee ${unique}`,
      email: `attendee.unknown.${unique}@example.com`,
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    };
    const nameOnlyAttendee = {
      name: `Name Only Attendee ${unique}`,
      email: `attendee.nameonly.${unique}@example.com`,
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

    const visitSelfCheckinAnonymously = () => {
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();
      cy.get("@selfCheckinUrl").then((selfCheckinUrl) => {
        cy.visit(String(selfCheckinUrl));
      });
      cy.contains(`${meetName} - Check-in`).should("be.visible");
      cy.window().then((win) => {
        expect(win.localStorage.getItem("accessToken")).to.be.null;
      });
      cy.get('input[placeholder="Your name"]').should("have.value", "");
      cy.get('input[placeholder="you@example.com"]').should("have.value", "");
      cy.get('input[placeholder="Mobile phone number"]').should(
        "have.value",
        "",
      );
    };

    cy.visit("/login");
    cy.get('input[type="email"]').type("bob@nowhere.com");
    cy.get('input[type="password"]').type("Password123!");
    cy.contains("button", "Login").click();
    cy.url().should("match", /\/$/);

    cy.createMinimalMeet({
      meetName,
      description: "Short description for walk-in self check-in test.",
      allowSelfCheckin: true,
      allowWalkins: true,
    }).as("shareLink");

    cy.logout();

    cy.get("@shareLink").then((shareLink) => {
      cy.wait(11000);
      [attendee, rejectedAttendee, nameOnlyAttendee].forEach((applicant) => {
        cy.visit(shareLink as unknown as string);
        cy.get('input[placeholder="Your name"]').clear().type(applicant.name);
        cy.get('input[placeholder="you@example.com"]')
          .clear()
          .type(applicant.email);
        cy.get('input[placeholder="Mobile phone number"]')
          .clear()
          .type(applicant.phone);
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
    openMeetRowMenu();
    cy.contains("Attendees").click();
    cy.contains('[role="button"]', attendee.name).click();
    cy.contains("button", "Accept").click();
    cy.contains('[role="button"]', nameOnlyAttendee.name).click();
    cy.contains("button", "Accept").click();
    cy.intercept("PATCH", "**/api/v1/meets/*/attendees/*").as("rejectAttendee");
    cy.contains('[role="button"]', rejectedAttendee.name).click();
    cy.contains("button", "Reject").click();
    cy.wait("@rejectAttendee")
      .its("response.body.attendee.status")
      .should("eq", "rejected");
    cy.get('[data-testid="close-attendees-modal"]').click();
    cy.contains("Notify attendees?").should("be.visible");
    cy.contains("button", "Later").click();
    cy.contains("Notify attendees?").should("not.exist");

    openMeetRowMenu();
    cy.contains("Close meet").click();
    cy.contains("button", "Close meet").click();

    openMeetRowMenu();
    cy.contains("Check-in").click();
    cy.get('[aria-label="Walk-ins enabled"]').should("be.visible");
    cy.get('[aria-label="Show self check-in QR code"]').click();
    cy.contains("Self check-in QR code").should("be.visible");
    cy.contains("/meets/")
      .invoke("text")
      .then((url) => {
        cy.wrap(url.trim()).as("selfCheckinUrl");
      });

    visitSelfCheckinAnonymously();
    cy.contains("button", "Register").should("be.visible");
    cy.get('input[placeholder="you@example.com"]').clear().type(attendee.email);

    cy.contains("Found a match, ready to check in.").should("be.visible");
    cy.intercept("PATCH", "**/api/v1/meets/*/attendee/*").as("checkInByEmail");
    cy.contains("button", "Check in").should("be.enabled").click();
    cy.wait("@checkInByEmail")
      .its("response.body.attendee")
      .should("include", { name: attendee.name, status: "checked-in" });

    cy.url().should("match", /\/meets\/[^/]+\/[^/]+$/);
    cy.contains(meetName).should("be.visible");

    visitSelfCheckinAnonymously();
    cy.get('input[placeholder="Mobile phone number"]')
      .clear()
      .type(rejectedAttendee.phone);

    cy.contains("Found a match, ready to check in.").should("be.visible");
    cy.intercept("PATCH", "**/api/v1/meets/*/attendee/*").as(
      "checkInRejectedAttendee",
    );
    cy.contains("button", "Check in").should("be.enabled").click();
    cy.wait("@checkInRejectedAttendee")
      .its("response.body.attendee.status")
      .should("eq", "checked-in");
    cy.get("@checkInRejectedAttendee")
      .its("response.body.attendee.name")
      .should("eq", rejectedAttendee.name);

    cy.url().should("match", /\/meets\/[^/]+\/[^/]+$/);
    cy.contains(meetName).should("be.visible");
    cy.contains("Checked in").should("be.visible");

    visitSelfCheckinAnonymously();
    cy.get('input[placeholder="Your name"]').clear().type(unknownAttendee.name);
    cy.get('input[placeholder="you@example.com"]')
      .clear()
      .type(unknownAttendee.email);
    cy.get('input[placeholder="Mobile phone number"]')
      .clear()
      .type(unknownAttendee.phone);

    cy.contains("No matches found yet").should("be.visible");
    cy.contains("button", "Check in").should("be.disabled");
    cy.contains("button", "Register").click();
    cy.url().should("include", "pin=");
    cy.get('input[placeholder="Your name"]').should(
      "have.value",
      unknownAttendee.name,
    );
    cy.get('input[placeholder="you@example.com"]').should(
      "have.value",
      unknownAttendee.email,
    );

    cy.intercept("POST", "**/api/v1/meets/*/attendees").as("registerWalkin");
    cy.contains("button", "Submit application").click();
    cy.wait("@registerWalkin")
      .its("response.body.attendee.status")
      .should("eq", "checked-in");
    cy.contains("Application submitted").should("be.visible");
    cy.contains("button", "Show Status").click();
    cy.contains("Checked in").should("be.visible");

    visitSelfCheckinAnonymously();
    cy.get('input[placeholder="Your name"]')
      .clear()
      .type(nameOnlyAttendee.name);

    cy.contains("Found a match, ready to check in.").should("be.visible");
    cy.intercept("PATCH", "**/api/v1/meets/*/attendee/*").as(
      "checkInNameOnlyAttendee",
    );
    cy.contains("button", "Check in").should("be.enabled").click();
    cy.wait("@checkInNameOnlyAttendee")
      .its("response.body.attendee")
      .should("include", {
        name: nameOnlyAttendee.name,
        status: "checked-in",
      });
    cy.contains("Checked in").should("be.visible");
  });
});
