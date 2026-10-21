export {};

describe("Meet signup previous answers", () => {
  it("fills adult and minor answers from earlier meets without saved profile answers", () => {
    const unique = Date.now();
    const organizerEmail = `organizer.previous.${unique}@example.com`;
    const organizerPhone = `555${Math.floor(1000000 + Math.random() * 9000000)}`;
    const attendeeEmail = `attendee.previous.${unique}@example.com`;
    const attendeePhone = `555${Math.floor(1000000 + Math.random() * 9000000)}`;
    const attendeeName = "Previous Answers Tester";
    const minorName = "Previous Answers Child";
    const adultAnswer = "Biltong";
    const minorAnswer = "Fruit";
    const adultColour = "Blue";
    const minorColour = "Green";
    const colourQuestion = "What is your favourite colour?";
    const questions = [
      { type: "text" as const, label: "Favourite trail snack" },
      { type: "text" as const, label: colourQuestion },
      { type: "switch" as const, label: "Bringing a headlamp?" },
    ];

    cy.session(`organizer-previous-answers-${unique}`, () => {
      cy.visit("/register", {
        onBeforeLoad(win) {
          win.localStorage.clear();
          win.sessionStorage.clear();
        },
      });
      cy.registerWithEmail({
        firstName: "Organizer",
        lastName: "Previous",
        phone: organizerPhone,
        email: organizerEmail,
        password: "Str0ng!Passw0rd2026",
      });
      cy.url().should("match", /\/$/);
    });

    cy.visit("/");
    cy.get('[data-testid="account-menu-button"]').click();
    cy.contains('[role="menuitem"]', "Organisation").click();
    cy.get('[data-testid="organization-modal"]').contains("Privacy").click();
    cy.contains("label", "Allow regular users to join with invite link")
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("button", "Save privacy settings").click();
    cy.get('[data-testid="close-organization-modal"]').click();

    cy.createMinimalMeet({
      meetName: `Previous Answers Profile ${unique}`,
    }).as("profileMeetLink");
    cy.createMinimalMeet({
      meetName: `Previous Answers Source ${unique}`,
      questions,
    }).as("sourceMeetLink");
    cy.createMinimalMeet({
      meetName: `Previous Answers Target ${unique}`,
      questions,
    }).as("targetMeetLink");

    cy.logout();
    cy.wait(11000);

    cy.get("@profileMeetLink").then((link) => {
      cy.visit(link as unknown as string);
    });
    cy.get('input[placeholder="Your name"]').type(attendeeName);
    cy.get('input[placeholder="you@example.com"]').type(attendeeEmail);
    cy.get('input[placeholder="Mobile phone number"]').type(attendeePhone);
    cy.contains("button", "Submit application").click();
    cy.contains("Application submitted").should("be.visible");
    cy.contains("button", "Create Profile").click();
    cy.url().should("include", "/register");
    cy.contains("Continue with Email").click();
    cy.get('input[type="text"]').first().should("have.value", "Previous");
    cy.get('input[type="text"]').eq(1).should("have.value", "Answers Tester");
    cy.get('input[type="email"]').should("have.value", attendeeEmail);
    cy.get('input[placeholder="Mobile phone number"]').type(attendeePhone);
    cy.get('input[type="password"]').type("Str0ng!Passw0rd2026");
    cy.contains("button", "Create account").click();
    cy.get('[data-testid="close-attendee-status"]').click();

    cy.intercept(
      "GET",
      /\/meets\/[^/]+\/my-previous-answers\?isMinor=false$/,
      (request) => {
        delete request.headers["if-none-match"];
        delete request.headers["if-modified-since"];
      },
    ).as("adultPreviousAnswers");
    cy.intercept(
      "GET",
      /\/meets\/[^/]+\/my-previous-answers\?isMinor=true$/,
      (request) => {
        delete request.headers["if-none-match"];
        delete request.headers["if-modified-since"];
      },
    ).as("minorPreviousAnswers");
    cy.intercept("POST", /\/meets\/[^/]+\/attendees$/).as("submitAttendee");
    cy.get("@sourceMeetLink").then((link) => {
      cy.visit(link as unknown as string);
    });
    cy.wait("@adultPreviousAnswers");
    cy.contains("Favourite trail snack")
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .should("have.value", "")
      .type(adultAnswer);
    cy.contains(colourQuestion)
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .should("have.value", "")
      .type(adultColour);
    cy.contains("label", "Bringing a headlamp?")
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("button", "Submit application").click();
    cy.wait("@submitAttendee").then(({ request, response }) => {
      expect(request.body.isMinor).to.equal(false);
      expect(
        request.body.metaValues.map(
          (answer: { value: string }) => answer.value,
        ),
      ).to.include(adultColour);
      expect(response?.body?.attendee?.isMinor).to.equal(false);
    });
    cy.contains("Application submitted").should("be.visible");
    cy.contains("label", "Remember my answers")
      .find('input[type="checkbox"]')
      .should("not.be.checked");

    cy.get("@sourceMeetLink").then((link) => {
      cy.visit(link as unknown as string);
    });
    cy.contains("Fill in on-behalf of a minor")
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.wait("@minorPreviousAnswers");
    cy.get('input[placeholder="Name of person attending the meet"]')
      .clear()
      .type(minorName);
    cy.contains("Favourite trail snack")
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .should("have.value", "")
      .type(minorAnswer);
    cy.contains(colourQuestion)
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .should("have.value", "")
      .type(minorColour);
    cy.contains("label", "Bringing a headlamp?")
      .find('input[type="checkbox"]')
      .should("not.be.checked");
    cy.contains("button", "Submit application").click();
    cy.wait("@submitAttendee").then(({ request, response }) => {
      expect(request.body.isMinor).to.equal(true);
      expect(
        request.body.metaValues.map(
          (answer: { value: string }) => answer.value,
        ),
      ).to.include(minorColour);
      expect(response?.body?.attendee?.isMinor).to.equal(true);
    });
    cy.contains("Application submitted").should("be.visible");

    cy.get("@targetMeetLink").then((link) => {
      cy.visit(link as unknown as string);
    });
    cy.wait("@adultPreviousAnswers");
    cy.contains("Favourite trail snack")
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .should("have.value", adultAnswer);
    cy.contains(colourQuestion)
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .should("have.value", adultColour);
    cy.contains(colourQuestion)
      .closest(".MuiStack-root")
      .find('[aria-label^="From prev meet:"]')
      .scrollIntoView()
      .should("be.visible");
    cy.contains("label", "Bringing a headlamp?")
      .find('input[type="checkbox"]')
      .should("not.be.checked");
    cy.contains("button", "Submit application").click();
    cy.wait("@submitAttendee").then(({ request, response }) => {
      expect(request.body.isMinor).to.equal(false);
      expect(
        request.body.metaValues.map(
          (answer: { value: string }) => answer.value,
        ),
      ).to.include(adultColour);
      expect(response?.body?.attendee?.isMinor).to.equal(false);
    });
    cy.contains("Application submitted").should("be.visible");

    cy.get("@targetMeetLink").then((link) => {
      cy.visit(link as unknown as string);
    });
    cy.wait("@adultPreviousAnswers");
    cy.contains("Fill in on-behalf of a minor")
      .parent()
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.wait("@minorPreviousAnswers");
    cy.get('input[placeholder="Name of person attending the meet"]')
      .clear()
      .type(minorName);
    cy.contains("Favourite trail snack")
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .should("have.value", minorAnswer);
    cy.contains(colourQuestion)
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .should("have.value", minorColour);
    cy.contains(colourQuestion)
      .closest(".MuiStack-root")
      .find('[aria-label^="From prev meet:"]')
      .scrollIntoView()
      .should("be.visible");
    cy.contains("label", "Bringing a headlamp?")
      .find('input[type="checkbox"]')
      .should("not.be.checked");
    cy.contains("button", "Submit application").click();
    cy.wait("@submitAttendee").then(({ request, response }) => {
      expect(request.body.isMinor).to.equal(true);
      expect(
        request.body.metaValues.map(
          (answer: { value: string }) => answer.value,
        ),
      ).to.include(minorColour);
      expect(response?.body?.attendee?.isMinor).to.equal(true);
    });
    cy.contains("Application submitted").should("be.visible");
  });
});
