export {};

const pad = (value: number) => String(value).padStart(2, "0");

const toLocalDateTimeInput = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

describe("Meet signup with Bob including minor and guest", () => {
  it("creates a meet and signs up a normal attendee, a minor, and a guest", () => {
    const unique = Date.now();
    const meetName = `Bob Signup Mixed Meet ${unique}`;
    const description = "Short description for bob mixed signup test.";
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const startValue = toLocalDateTimeInput(start);

    const hostAttendee = {
      name: "Normal Attendee",
      email: `normal.${unique}@example.com`,
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
      guestName: "Guest Attendee",
    };
    const minorAttendee = {
      name: "Minor Attendee",
      guardianName: "Guardian Person",
      email: `guardian.${unique}@example.com`,
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    };

    cy.visit("/login");
    cy.get('input[type="email"]').type("bob@nowhere.com");
    cy.get('input[type="password"]').type("Password123!");
    cy.contains("button", "Login").click();
    cy.url().should("match", /\/$/);

    cy.visit("/plan");
    cy.contains("button", "New meet").click();

    cy.get('input[placeholder="Give your meet a name"]').type(meetName);
    cy.get('textarea[placeholder="Describe your meet in detail here"]')
      .clear()
      .type(description, { delay: 0 });
    cy.contains("button", "Save & Continue").click();

    cy.get('[data-testid="start-time-input"]').clear().type(startValue);
    cy.contains("button", "Save & Continue").click();

    cy.contains("button", "Save & Continue").click();
    cy.contains("button", "Save & Continue").click();

    cy.contains("label", "Allow attendees to bring guests")
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.get('input[placeholder="How many guests per attendee?"]')
      .clear()
      .type("1");
    cy.contains("button", "Save & Continue").click();

    for (let i = 0; i < 3; i += 1) {
      cy.contains("button", "Save & Continue").click();
    }

    cy.get('[data-testid="share-link-input"]')
      .invoke("val")
      .then((value) => {
        expect(value).to.match(/\/meets\//);
        cy.wrap(value).as("shareLink");
      });

    cy.contains("button", "Publish").click();

    cy.get('[data-testid="account-menu-button"]').click();
    cy.contains("Logout").click();

    cy.intercept("POST", "**/meets/*/attendees").as("createAttendee");

    cy.get("@shareLink").then((shareLink) => {
      cy.wait(20000);

      cy.visit(shareLink as unknown as string);
      cy.get('input[placeholder="Your name"]').clear().type(hostAttendee.name);
      cy.get('input[placeholder="you@example.com"]')
        .clear()
        .type(hostAttendee.email);
      cy.get('input[placeholder="Mobile phone number"]')
        .clear()
        .type(hostAttendee.phone);
      cy.contains("I would like to bring guests")
        .parent()
        .find('input[type="checkbox"]')
        .check({ force: true });
      cy.contains("button", "+ Add guest").click();
      cy.contains("Guest 1 name").parent().find("input").type(hostAttendee.guestName);
      cy.contains("button", "Submit application").click();
      cy.contains("Application submitted").should("be.visible");

      cy.wait("@createAttendee").then((interception) => {
        const attendeeId = interception.response?.body?.attendee?.id;
        expect(attendeeId).to.be.a("string");
        cy.wrap(`${shareLink}?guestOf=${attendeeId}`).as("guestLink");
      });

      cy.visit(shareLink as unknown as string);
      cy.contains("Fill in on-behalf of a minor")
        .parent()
        .find('input[type="checkbox"]')
        .check({ force: true });
      cy.get('input[placeholder="Name of person attending the meet"]')
        .clear()
        .type(minorAttendee.name);
      cy.get('input[placeholder="Parent or guardian name"]')
        .clear()
        .type(minorAttendee.guardianName);
      cy.get('input[placeholder="you@example.com"]')
        .clear()
        .type(minorAttendee.email);
      cy.get('input[placeholder="Mobile phone number"]')
        .clear()
        .type(minorAttendee.phone);
      cy.contains("button", "Submit application").click();
      cy.contains("Application submitted").should("be.visible");
    });

    cy.get("@guestLink").then((guestLink) => {
      cy.visit(guestLink as unknown as string);
      cy.get('input[placeholder="Your name"]').clear().type(hostAttendee.guestName);
      cy.get('input[placeholder="you@example.com"]')
        .clear()
        .type(`guest.${unique}@example.com`);
      cy.get('input[placeholder="Mobile phone number"]')
        .clear()
        .type(`555${Math.floor(1000000 + Math.random() * 9000000)}`);
      cy.contains("button", "Submit application").click();
      cy.contains("Application submitted").should("be.visible");
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

    cy.contains(hostAttendee.name).scrollIntoView().should("be.visible");
    cy.contains(minorAttendee.name).scrollIntoView().should("be.visible");
    cy.contains(hostAttendee.guestName)
      .scrollIntoView()
      .should("be.visible")
      .closest('[role="button"]')
      .within(() => {
        cy.get(".MuiChip-root").contains(".MuiChip-label", "Guest").should("be.visible");
      });

    cy.contains("button", "Close").click();
  });
});
