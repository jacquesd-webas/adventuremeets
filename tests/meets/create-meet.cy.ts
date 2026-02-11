const pad = (value: number) => String(value).padStart(2, "0");

const toLocalDateTimeInput = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

describe("Create meet flow", () => {
  it("registers, creates, edits, publishes, and checks attendees", () => {
    const unique = Date.now();
    const email = `cypress.user.${unique}@example.com`;
    const meetName = `Cypress Meet ${unique}`;
    const description =
      "This is an automated Cypress meet description used for end-to-end testing. " +
      "We will gather at a scenic trailhead and set out on a relaxed group walk with plenty of time for photos, " +
      "snacks, and conversation. The plan is to move at an easy pace, pause at viewpoints, and keep the vibe " +
      "social rather than competitive. Participants should bring water, a light layer, and comfortable shoes " +
      "suitable for mixed terrain. We will cover a few miles with optional short detours for those who want " +
      "an extra stretch. If you are new to group walks, you are welcome — we will make space for everyone " +
      "and keep the route accessible. Expect a short briefing at the start, a mid-walk break, and a gentle " +
      "finish near the parking area. If the weather is warm, consider sun protection and a hat. If it is cool, " +
      "bring a warm layer and a thermos. This meet is intended to be friendly and low pressure, with a focus " +
      "on enjoying the outdoors and meeting new people. We will also do a quick check-in at the end to make sure " +
      "everyone has a safe ride home. Please arrive on time so we can start together and respect the group schedule.";
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);
    const startValue = toLocalDateTimeInput(start);
    const endValue = toLocalDateTimeInput(end);

    // Register

    cy.visit("/register");
    cy.contains("Continue with Email").click();
    cy.get('input[type="text"]').first().type("Cypress");
    cy.get('input[type="text"]').eq(1).type("User");
    cy.get('input[placeholder="Mobile phone number"]').type("5550001111");
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type("Str0ng!Pa$$w0rd123!");
    cy.contains("button", "Create account").click();
    cy.url().should("match", /\/$/);
    cy.contains("Dashboard").should("be.visible");

    // Create meet

    cy.visit("/plan");
    cy.contains("button", "New meet").click();

    cy.get('input[placeholder="Give your meet a name"]').type(meetName);
    cy.get('textarea[placeholder="Describe your meet in detail here"]')
      .clear()
      .type(description, { delay: 0 });
    cy.contains("button", "Save & Continue").click();

    cy.get('[data-testid="start-time-input"]').type(startValue);
    cy.get('[data-testid="end-time-input"]').type(endValue);
    cy.contains("button", "Save & Continue").click();

    cy.get(
      'textarea[placeholder="Paste or write indemnity text attendees must accept"]',
    )
      .clear()
      .type(
        "By attending this meet, you acknowledge the inherent risks of outdoor activities and agree to take reasonable precautions. You accept full responsibility for your safety and agree to follow organizer instructions.",
        { delay: 0 },
      );
    cy.contains("label", "Require attendees to accept indemnity")
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("button", "Save & Continue").click();

    cy.contains("button", "Textfield").click();
    cy.contains("button", "Select").click();
    cy.contains("button", "Switch").click();
    cy.contains("button", "Checkbox").click();

    cy.get('input[placeholder="What should the user see?"]')
      .eq(0)
      .type("Trail experience level");
    cy.get('input[placeholder="What should the user see?"]')
      .eq(1)
      .type("Preferred pace");
    cy.get('input[placeholder="e.g. Beginner, Intermediate, Advanced"]')
      .first()
      .type("Easy, Moderate, Fast");
    cy.get('input[placeholder="What should the user see?"]')
      .eq(2)
      .type("Will you bring extra water?");
    cy.get('input[placeholder="What should the user see?"]')
      .eq(3)
      .type("Agree to leave no trace?");

    cy.contains("button", "Save & Continue").click();

    cy.get('input[placeholder="Maximum participants"]').clear().type("12");
    cy.get('input[placeholder="How many on the waitlist?"]').clear().type("3");
    cy.contains("button", "Save & Continue").click();

    cy.get('[data-testid="cost-input"]').type("45");
    cy.get('[data-testid="deposit-input"]').type("15");
    cy.contains("button", "Save & Continue").click();

    cy.get('textarea[placeholder="Message sent to approved attendees"]')
      .clear()
      .type("You are approved and we are excited to see you at the meet!", {
        delay: 0,
      });
    cy.get('textarea[placeholder="Message sent to rejected applicants"]')
      .clear()
      .type(
        "Thanks for applying. Unfortunately we cannot accommodate you this time.",
        { delay: 0 },
      );
    cy.get('textarea[placeholder="Message sent to people on the waitlist"]')
      .clear()
      .type(
        "You are currently on the waitlist. We will notify you if a spot opens.",
        { delay: 0 },
      );
    cy.contains("button", "Save & Continue").click();

    // skip image
    cy.contains("button", "Save & Continue").click();

    cy.get('[data-testid="share-link-input"]')
      .invoke("val")
      .then((value) => {
        expect(value).to.match(/\/meets\//);
        cy.wrap(value).as("shareLink");
      });
    cy.contains("button", "Publish").click();

    // Check meet is in the dashboard

    cy.contains(meetName)
      .parents('[role="row"]')
      .first()
      .within(() => {
        cy.get('svg[data-testid="MoreVertIcon"]').parent("button").click();
      });
    cy.contains("Meet details").click();
    cy.contains(meetName).should("be.visible");
    cy.contains("Cypress User").should("be.visible");
    cy.get('[aria-label="Close"]').click();

    // Edit the meet

    cy.contains(meetName)
      .parents('[role="row"]')
      .first()
      .within(() => {
        cy.get('svg[data-testid="MoreVertIcon"]').parent("button").click();
      });
    cy.contains("Edit").click();

    cy.get('input[placeholder="Give your meet a name"]').should(
      "have.value",
      meetName,
    );
    cy.get('textarea[placeholder="Describe your meet in detail here"]').should(
      "have.value",
      description,
    );

    cy.contains("button", "Save & Continue").click();

    cy.get('[data-testid="start-time-input"]').should("have.value", startValue);
    cy.get('[data-testid="end-time-input"]').should("have.value", endValue);

    cy.contains("button", "Save & Continue").click();

    cy.get(
      'textarea[placeholder="Paste or write indemnity text attendees must accept"]',
    ).should(
      "have.value",
      "By attending this meet, you acknowledge the inherent risks of outdoor activities and agree to take reasonable precautions. You accept full responsibility for your safety and agree to follow organizer instructions.",
    );
    cy.contains("label", "Require attendees to accept indemnity")
      .find('input[type="checkbox"]')
      .should("be.checked");
    cy.contains("button", "Save & Continue").click();

    cy.get('input[placeholder="What should the user see?"]')
      .eq(0)
      .should("have.value", "Trail experience level");
    cy.get('input[placeholder="What should the user see?"]')
      .eq(1)
      .should("have.value", "Preferred pace");
    cy.get('input[placeholder="e.g. Beginner, Intermediate, Advanced"]')
      .first()
      .should("have.value", "Easy, Moderate, Fast");
    cy.get('input[placeholder="What should the user see?"]')
      .eq(2)
      .should("have.value", "Will you bring extra water?");
    cy.get('input[placeholder="What should the user see?"]')
      .eq(3)
      .should("have.value", "Agree to leave no trace?");
    cy.contains("button", "Save & Continue").click();

    cy.get('input[placeholder="When can attendees start applying?"]').should(
      "not.have.value",
      "",
    );
    cy.get('input[placeholder="When do applications close?"]').should(
      "not.have.value",
      "",
    );
    cy.get('input[placeholder="Maximum participants"]').should(
      "have.value",
      "12",
    );
    cy.get('input[placeholder="How many on the waitlist?"]').should(
      "have.value",
      "3",
    );
    cy.contains("button", "Save & Continue").click();

    cy.get('[data-testid="cost-input"]').should("have.value", "45");
    cy.get('[data-testid="deposit-input"]').should("have.value", "15");
    cy.contains("button", "Save & Continue").click();

    cy.get('textarea[placeholder="Message sent to approved attendees"]').should(
      "have.value",
      "You are approved and we are excited to see you at the meet!",
    );
    cy.get(
      'textarea[placeholder="Message sent to rejected applicants"]',
    ).should(
      "have.value",
      "Thanks for applying. Unfortunately we cannot accommodate you this time.",
    );
    cy.get(
      'textarea[placeholder="Message sent to people on the waitlist"]',
    ).should(
      "have.value",
      "You are currently on the waitlist. We will notify you if a spot opens.",
    );
    cy.contains("button", "Save & Continue").click();

    // skip image
    cy.contains("button", "Save & Continue").click();

    cy.contains("button", "Save & Close").click();

    cy.contains(meetName)
      .parents('[role="row"]')
      .first()
      .within(() => {
        cy.get('svg[data-testid="MoreVertIcon"]').parent("button").click();
      });
    cy.contains("Attendees").click();

    cy.contains("Cypress User")
      .closest('[role="button"]')
      .within(() => {
        cy.get('svg[data-testid="SupervisorAccountOutlinedIcon"]').should(
          "be.visible",
        );
      });

    cy.contains("button", "Close").click();

    cy.contains("Dashboard").should("be.visible");
    cy.contains(meetName).should("be.visible");

    cy.visit("/calendar");
    cy.contains("Calendar").should("be.visible");
    cy.contains(meetName).should("be.visible");

    cy.visit("/plan");
    cy.contains("Meets").should("be.visible");
    cy.contains(meetName).should("be.visible");

    cy.get('[data-testid="account-menu-button"]').click();
    cy.contains("Logout").click();

    cy.get("@shareLink").then((shareLink) => {
      cy.visit(shareLink as unknown as string);
      cy.wait(20000);
      cy.visit(shareLink as unknown as string);
    });

    cy.contains(meetName).should("be.visible");
    cy.contains(
      "This is an automated Cypress meet description used for end-to-end testing.",
    ).should("be.visible");
    cy.get('[data-testid="meet-cost"]').should("contain.text", "45");

    cy.contains("Trail experience level").should("be.visible");
    cy.contains("Preferred pace").should("be.visible");
    cy.contains("Will you bring extra water?").should("be.visible");
    cy.contains("Agree to leave no trace?").should("be.visible");

    cy.contains(
      "By attending this meet, you acknowledge the inherent risks of outdoor activities",
    ).should("be.visible");
  });
});
