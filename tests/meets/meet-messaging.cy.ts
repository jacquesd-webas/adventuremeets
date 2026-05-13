export {};

describe("Meet messaging", () => {
  it("sends the correct status and custom messages to attendees", () => {
    const unique = Date.now();
    const organizerEmail = "charlie@nowhere.com";
    const organizerPassword = "Password123!";
    const meetName = `Meet Messaging ${unique}`;
    const description = "Short description for meet messaging test.";
    const customSubject = `Custom note ${unique}`;
    const customBody = `Custom body ${unique}`;
    const attendees = Array.from({ length: 5 }, (_, index) => ({
      name: `Messaging Attendee ${index + 1}`,
      email: `messaging.attendee.${unique}.${index + 1}@example.com`,
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    }));

    const openMeetRowMenu = () => {
      cy.contains(meetName).scrollIntoView().should("be.visible");
      cy.contains(meetName)
        .parents('[role="row"]')
        .first()
        .as("createdMeetRow");
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

    const openAttendeeMessages = (name: string) => {
      cy.contains('[role="button"]', name).click();
      cy.get('[aria-label="Message attendee"]').first().click();
    };

    const typeInLabeledField = (
      label: string,
      value: string,
      tag: "input" | "textarea",
    ) => {
      cy.contains("label", label)
        .invoke("attr", "for")
        .then((fieldId) => {
          cy.get(`${tag}#${fieldId}`).clear().type(value);
        });
    };

    const expectVisibleTexts = (texts: string[]) => {
      texts.forEach((text) => cy.contains(text).should("be.visible"));
    };

    const expectAbsentTexts = (texts: string[]) => {
      texts.forEach((text) => cy.contains(text).should("not.exist"));
    };

    cy.visit("/login");
    cy.get('input[type="email"]').type(organizerEmail);
    cy.get('input[type="password"]').type(organizerPassword);
    cy.contains("button", "Login").click();
    cy.url().should("match", /\/$/);

    cy.createMinimalMeet({
      meetName,
      description,
    }).as("shareLink");

    cy.logout();
    cy.wait(20000);

    cy.get("@shareLink").then((shareLink) => {
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
    cy.get('input[type="email"]').type(organizerEmail);
    cy.get('input[type="password"]').type(organizerPassword);
    cy.contains("button", "Login").click();
    cy.contains("Dashboard").should("be.visible");

    cy.visit("/plan");
    openMeetRowMenu();
    cy.contains("Attendees").click();

    setAttendeeStatus(attendees[0].name, "Accept");
    setAttendeeStatus(attendees[1].name, "Reject");
    setAttendeeStatus(attendees[2].name, "Waitlist");

    cy.contains('[role="button"]', attendees[4].name).click();
    cy.contains("button", `Message ${attendees[4].name}`).click();
    cy.contains("Send message").should("be.visible");
    typeInLabeledField("Subject", customSubject, "input");
    typeInLabeledField("Message", customBody, "textarea");
    cy.contains("button", "Send").click();
    cy.contains("Send message").should("not.exist");

    cy.get('[data-testid="close-attendees-modal"]').click();
    cy.contains("Notify attendees?").should("be.visible");
    cy.contains("button", "Notify now").click();
    cy.contains("Notify attendees?").should("not.exist");

    openMeetRowMenu();
    cy.contains("Attendees").click();

    openAttendeeMessages(attendees[0].name);
    expectVisibleTexts([`Confirmed: ${meetName}`]);
    expectAbsentTexts([
      `Waitlist: ${meetName}`,
      `Update: ${meetName}`,
      customSubject,
    ]);

    openAttendeeMessages(attendees[1].name);
    expectVisibleTexts([`Update: ${meetName}`]);
    expectAbsentTexts([
      `Confirmed: ${meetName}`,
      `Waitlist: ${meetName}`,
      customSubject,
    ]);

    openAttendeeMessages(attendees[2].name);
    expectVisibleTexts([`Waitlist: ${meetName}`]);
    expectAbsentTexts([
      `Confirmed: ${meetName}`,
      `Update: ${meetName}`,
      customSubject,
    ]);

    openAttendeeMessages(attendees[3].name);
    expectAbsentTexts([
      `Confirmed: ${meetName}`,
      `Waitlist: ${meetName}`,
      `Update: ${meetName}`,
      customSubject,
    ]);

    openAttendeeMessages(attendees[4].name);
    expectVisibleTexts([customSubject, customBody]);
    expectAbsentTexts([
      `Confirmed: ${meetName}`,
      `Waitlist: ${meetName}`,
      `Update: ${meetName}`,
    ]);
  });
});
