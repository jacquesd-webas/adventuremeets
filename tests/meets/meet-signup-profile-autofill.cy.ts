export {};

describe("Meet signup profile autofill", () => {
  it("fills attendee details on a second meet signup and saved answers on a third meet after remembering them", () => {
    const unique = Date.now();
    const organizerEmail = `organizer.autofill.${unique}@example.com`;
    const organizerPassword = "Str0ng!Passw0rd2026";
    const organizerPhone = `555${Math.floor(1000000 + Math.random() * 9000000)}`;
    const firstMeetName = `Autofill Meet One ${unique}`;
    const secondMeetName = `Autofill Meet Two ${unique}`;
    const thirdMeetName = `Autofill Meet Three ${unique}`;
    const attendeeFirstName = "Autofill";
    const attendeeLastName = "Tester";
    const attendeeFullName = `${attendeeFirstName} ${attendeeLastName}`;
    const attendeeEmail = `attendee.autofill.${unique}@example.com`;
    const attendeePhone = `555${Math.floor(1000000 + Math.random() * 9000000)}`;
    const attendeePassword = "Str0ng!Passw0rd2026";
    const snackAnswer = "Biltong";
    const questions = [
      {
        type: "text" as const,
        label: "Favourite trail snack",
      },
      {
        type: "switch" as const,
        label: "Bringing a headlamp?",
      },
    ];

    cy.session(`organizer-autofill-${unique}`, () => {
      cy.visit("/register", {
        onBeforeLoad(win) {
          win.localStorage.clear();
          win.sessionStorage.clear();
        },
      });
      cy.registerWithEmail({
        firstName: "Organizer",
        lastName: "Autofill",
        phone: organizerPhone,
        email: organizerEmail,
        password: organizerPassword,
      });
      cy.url().should("match", /\/$/);
    });

    cy.visit("/");

    cy.openProfileModal();
    cy.contains("Organisation").click();
    cy.contains("label", "Allow regular users to join with invite link")
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("button", "Save organisation").click();
    cy.closeProfileModal();

    cy.createMinimalMeet({
      meetName: firstMeetName,
      description: "First meet for autofill testing.",
      questions,
    }).as("firstShareLink");

    cy.createMinimalMeet({
      meetName: secondMeetName,
      description: "Second meet for autofill testing.",
      questions,
    }).as("secondShareLink");

    cy.createMinimalMeet({
      meetName: thirdMeetName,
      description: "Third meet for autofill testing.",
      questions,
    }).as("thirdShareLink");

    cy.logout();
    cy.wait(11000);

    cy.get("@firstShareLink").then((firstShareLink) => {
      cy.visit(firstShareLink as unknown as string);
    });

    cy.get('input[placeholder="Your name"]').type(attendeeFullName);
    cy.get('input[placeholder="you@example.com"]').type(attendeeEmail);
    cy.get('input[placeholder="Mobile phone number"]').type(attendeePhone);
    cy.contains("Favourite trail snack")
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .type(snackAnswer);
    cy.contains("label", "Bringing a headlamp?")
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("button", "Submit application").click();
    cy.contains("Application submitted").should("be.visible");
    cy.contains("button", "Create Profile").click();

    cy.url().should("include", "/register");
    cy.contains("Continue with Email").click();
    cy.get('input[type="text"]')
      .first()
      .should("have.value", attendeeFirstName);
    cy.get('input[type="text"]').eq(1).should("have.value", attendeeLastName);
    cy.get('input[type="email"]').should("have.value", attendeeEmail);
    cy.get('input[placeholder="Mobile phone number"]').type(attendeePhone);
    cy.get('input[type="password"]').type(attendeePassword);
    cy.contains("button", "Create account").click();

    cy.get('[data-testid="close-attendee-status"]').click();
    cy.get("@secondShareLink").then((secondShareLink) => {
      cy.visit(secondShareLink as unknown as string);
    });

    cy.get('input[placeholder="Your name"]').should(
      "have.value",
      attendeeFullName,
    );
    cy.get('input[placeholder="you@example.com"]').should(
      "have.value",
      attendeeEmail,
    );
    cy.get('input[placeholder="Mobile phone number"]').should(
      "have.value",
      attendeePhone,
    );
    cy.contains("Favourite trail snack")
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .should("have.value", "");
    cy.contains("label", "Bringing a headlamp?")
      .find('input[type="checkbox"]')
      .should("not.be.checked");

    cy.contains("Favourite trail snack")
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .type(snackAnswer);
    cy.contains("label", "Bringing a headlamp?")
      .find('input[type="checkbox"]')
      .check({ force: true });
    cy.contains("button", "Submit application").click();
    cy.contains("Application submitted").should("be.visible");
    cy.contains("label", "Remember my answers")
      .find('input[type="checkbox"]')
      .check({ force: true })
      .should("be.disabled");
    cy.contains("Answers saved for future signups").should("be.visible");

    cy.get("@thirdShareLink").then((thirdShareLink) => {
      cy.visit(thirdShareLink as unknown as string);
    });

    cy.get('input[placeholder="Your name"]').should(
      "have.value",
      attendeeFullName,
    );
    cy.get('input[placeholder="you@example.com"]').should(
      "have.value",
      attendeeEmail,
    );
    cy.get('input[placeholder="Mobile phone number"]').should(
      "have.value",
      attendeePhone,
    );
    cy.contains("Favourite trail snack")
      .closest(".MuiStack-root")
      .find('input[type="text"]')
      .should("have.value", snackAnswer);
    cy.contains("label", "Bringing a headlamp?")
      .find('input[type="checkbox"]')
      .should("be.checked");
  });
});
