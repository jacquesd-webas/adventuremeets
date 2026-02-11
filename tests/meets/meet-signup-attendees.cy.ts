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

describe("Meet signup with Bob", () => {
  it("creates a meet and signs up five attendees", () => {
    const unique = Date.now();
    const meetName = `Bob Signup Meet ${unique}`;
    const description = "Short description for bob signup test.";
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const startValue = toLocalDateTimeInput(start);

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

    for (let i = 0; i < 6; i += 1) {
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

    const attendees = Array.from({ length: 5 }, (_, index) => ({
      name: `Attendee ${index + 1}`,
      email: `attendee.${unique}.${index + 1}@example.com`,
      phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    }));

    cy.get("@shareLink").then((shareLink) => {
      cy.wait(20000);
      cy.wrap(attendees).each((attendee) => {
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
    cy.contains(meetName).should("be.visible");

    cy.contains(meetName)
      .parents('[role="row"]')
      .first()
      .within(() => {
        cy.get('svg[data-testid="MoreVertIcon"]').parent("button").click();
      });
    cy.contains("Attendees").click();

    attendees.forEach((attendee) => {
      cy.contains(attendee.name).should("be.visible");
    });

    cy.contains("button", "Close").click();
  });
});
