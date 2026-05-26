export {};

describe("Meet check-in", () => {
  it("checks in confirmed attendees and shows attended/no-show in the report", () => {
    const unique = Date.now();
    const meetName = `Bob Checkin Meet ${unique}`;
    const description = "Short description for bob checkin test.";
    const start = new Date(Date.now() + 120 * 1000);

    const attendees = Array.from({ length: 5 }, (_, index) => ({
      name: `Attendee ${index + 1}`,
      email: `attendee.${unique}.${index + 1}@example.com`,
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    }));
    const organizerEmail = "bob@nowhere.com";

    const confirmedAttendees = attendees.slice(0, 3);
    const waitlistedAttendee = attendees[3];
    const rejectedAttendee = attendees[4];

    const scrollToMeet = () => {
      cy.contains(meetName).scrollIntoView().should("be.visible");
    };

    const openMeetRowMenu = () => {
      scrollToMeet();
      cy.contains(meetName)
        .parents('[role="row"]')
        .first()
        .as("createdMeetRow");
      cy.get("@createdMeetRow").should("be.visible");
      cy.get("@createdMeetRow").within(() => {
        cy.get('svg[data-testid="MoreVertIcon"]').parent("button").click();
      });
    };

    const setAttendeeStatus = (
      name: string,
      action: "Accept" | "Waitlist" | "Reject",
    ) => {
      cy.contains('[role="button"]', name).click();
      cy.contains("button", action).click();
    };

    cy.visit("/login");
    cy.get('input[type="email"]').type("bob@nowhere.com");
    cy.get('input[type="password"]').type("Password123!");
    cy.contains("button", "Login").click();
    cy.url().should("match", /\/$/);

    cy.createMinimalMeet({
      meetName,
      description,
      start,
    }).as("shareLink");

    cy.logout();

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
    openMeetRowMenu();
    cy.contains("Attendees").click();

    confirmedAttendees.forEach((attendee) => {
      setAttendeeStatus(attendee.name, "Accept");
    });
    setAttendeeStatus(waitlistedAttendee.name, "Waitlist");
    setAttendeeStatus(rejectedAttendee.name, "Reject");

    cy.get('[data-testid="close-attendees-modal"]').click();
    cy.contains("Notify attendees?").should("be.visible");
    cy.contains("button", "Later").click();
    cy.contains("Notify attendees?").should("not.exist");

    openMeetRowMenu();
    cy.contains("Close meet").click();
    cy.contains("button", "Close meet").click();

    openMeetRowMenu();
    cy.contains("Check-in").click();

    confirmedAttendees.forEach((attendee) => {
      cy.contains(attendee.name).should("be.visible");
    });
    cy.contains(organizerEmail).should("be.visible");
    cy.contains(waitlistedAttendee.name).should("not.exist");
    cy.contains(rejectedAttendee.name).should("not.exist");

    cy.contains("li", organizerEmail).click();
    cy.contains(confirmedAttendees[0].name).click();
    cy.contains(confirmedAttendees[1].name).click();

    cy.contains("button", "Finish Check-In").click();
    cy.contains("Meets").should("be.visible");

    cy.wait(30000);

    openMeetRowMenu();
    cy.contains("Generate Report").click();

    cy.contains("td", confirmedAttendees[0].name)
      .parent("tr")
      .within(() => {
        cy.contains("Attended").should("be.visible");
      });
    cy.contains("td", confirmedAttendees[1].name)
      .parent("tr")
      .within(() => {
        cy.contains("Attended").should("be.visible");
      });
    cy.contains("td", organizerEmail)
      .parent("tr")
      .within(() => {
        cy.contains("Attended").should("be.visible");
      });
    cy.contains("td", confirmedAttendees[2].name)
      .parent("tr")
      .within(() => {
        cy.contains("No show").should("be.visible");
      });
    cy.contains("td", waitlistedAttendee.name).should("not.exist");
    cy.contains("td", rejectedAttendee.name).should("not.exist");

    cy.contains("Download report to your browser")
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("Send report to the organiser's email address")
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("button", "Generate report").click();
  });
});
