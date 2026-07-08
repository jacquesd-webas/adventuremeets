export {};

describe("Meet wall posting", () => {
  it("captures attendee status links and shows the meet wall in meet details after the meet closes automatically", () => {
    const unique = Date.now();
    const organizerEmail = "bob@nowhere.com";
    const organizerPassword = "Password123!";
    const meetName = `Meet Wall ${unique}`;
    const description = "Short description for meet wall posting test.";
    const organizerComment = `Great walk ${unique}`;
    const startAtMs = Date.now() + 70_000;
    const attendeeStatusUrls: string[] = [];
    const wallPhotoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="#d7f4e3"/><circle cx="70" cy="80" r="28" fill="#ffb84d"/><path d="M0 200 L70 120 L118 170 L168 95 L240 200 Z" fill="#3b7a57"/><rect x="24" y="24" width="92" height="24" rx="12" fill="#184d47"/><text x="36" y="41" font-size="14" fill="#ffffff">Wall ${unique}</text></svg>`;
    let shareLink = "";

    const attendees = [
      {
        name: `Wall Attendee 1 ${unique}`,
        email: `wall.attendee.${unique}.1@example.com`,
        phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
      },
      {
        name: `Wall Attendee 2 ${unique}`,
        email: `wall.attendee.${unique}.2@example.com`,
        phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
      },
      {
        name: `Wall Attendee 3 ${unique}`,
        email: `wall.attendee.${unique}.3@example.com`,
        phone: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
      },
    ];

    const loginAsOrganizer = () => {
      cy.visit("/login");
      cy.get('input[type="email"]').type(organizerEmail);
      cy.get('input[type="password"]').type(organizerPassword);
      cy.contains("button", "Login").click();
      cy.url().should("match", /\/$/);
    };

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

    const waitForClosedMeetInPast = () => {
      let isClosedInPast = false;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        cy.then(() => {
          if (isClosedInPast) return;

          cy.visit("/plan");
          cy.contains("button", "Past").click();
          cy.get("body").then(($body) => {
            if (!$body.text().includes(meetName)) {
              return;
            }

            cy.contains(meetName).scrollIntoView().should("be.visible");
            cy.contains(meetName)
              .parents('[role="row"]')
              .first()
              .as("createdMeetRow");

            cy.wait(500); // settle chip status
            cy.get("@createdMeetRow").then(($row) => {
              isClosedInPast =
                $row.find(".MuiChip-label").filter((_, element) => {
                  return element.textContent?.trim() === "Closed";
                }).length > 0;
            });
          });
        });

        if (attempt < 4) {
          cy.then(() => {
            if (!isClosedInPast) {
              cy.wait(10_000);
            }
          });
        }
      }

      cy.then(() => {
        expect(
          isClosedInPast,
          "Meet did not appear in Past with Closed status",
        ).to.eq(true);
      });
    };

    const buildAttendeeStatusUrl = (
      baseShareLink: string,
      attendeeId: string,
      origin: string,
    ) => {
      const shareUrl = new URL(baseShareLink, origin);
      const shareCode = shareUrl.pathname.split("/").filter(Boolean).pop();

      expect(shareCode, "share code from share link").to.be.a("string").and.not
        .be.empty;

      return new URL(`/meets/${shareCode}/${attendeeId}`, origin).toString();
    };

    const submitApplication = (attendee: (typeof attendees)[number]) => {
      cy.visit(shareLink);
      cy.get('input[placeholder="Your name"]').clear().type(attendee.name);
      cy.get('input[placeholder="you@example.com"]')
        .clear()
        .type(attendee.email);
      cy.get('input[placeholder="Mobile phone number"]')
        .clear()
        .type(attendee.phone);
      cy.contains("button", "Submit application").click();
      cy.contains("Application submitted").should("be.visible");
      cy.window().then((win) => {
        const origin = win.location.origin;

        cy.wait("@createAttendee").then((interception) => {
          const attendeeId = interception.response?.body?.attendee?.id;
          expect(attendeeId).to.be.a("string");
          const attendeeStatusUrl = buildAttendeeStatusUrl(
            shareLink,
            attendeeId as string,
            origin,
          );
          cy.log(`Attendee status URL: ${attendeeStatusUrl}`);
          attendeeStatusUrls.push(attendeeStatusUrl);
        });
      });
    };

    const visitAttendeeWall = (index: number) => {
      cy.then(() => {
        const attendeeStatusUrl = attendeeStatusUrls[index];
        expect(attendeeStatusUrl, `attendeeStatusUrls[${index}]`).to.be.a(
          "string",
        );
        expect(attendeeStatusUrl, `attendeeStatusUrls[${index}]`).to.not.equal(
          "",
        );
        cy.visit(attendeeStatusUrl);
      });
      cy.contains("Meet Feedback").should("be.visible");
    };

    const openMeetDetails = () => {
      openMeetRowMenu();
      cy.contains("Meet details").click();
      cy.contains("Meet Feedback").should("be.visible");
    };

    cy.intercept("POST", "**/api/v1/meets/*/attendees").as("createAttendee");

    loginAsOrganizer();

    cy.createMinimalMeet({
      meetName,
      description,
      start: new Date(startAtMs),
    }).as("shareLink");

    cy.get("@shareLink").then((createdShareLink) => {
      shareLink = String(createdShareLink);
      cy.logout();
      cy.wait(11000);

      attendees.forEach((attendee) => {
        submitApplication(attendee);
      });
    });

    loginAsOrganizer();

    cy.then(() => {
      expect(attendeeStatusUrls).to.have.length(3);
    });
    waitForClosedMeetInPast();

    openMeetDetails();
    cy.contains("button", "Add Comment").should("be.visible");
    cy.get('button[aria-label="Rate Meet"]').should("not.exist");

    cy.contains("button", "Add Comment").click();
    cy.get('textarea[placeholder="Share your thoughts about the meet"]')
      .should("be.visible")
      .type(organizerComment);
    cy.contains("button", "Post Comment").click();
    cy.contains(organizerComment).should("be.visible");

    cy.contains('[data-testid="meet-wall-card"]', organizerComment).within(
      () => {
        cy.get('button[aria-label="Favourite"]').click();
      },
    );

    cy.get('[data-testid="meet-wall-card"]').then(($cards) => {
      const cardCountBeforePhoto = $cards.length;

      cy.get('input[type="file"]').selectFile(
        {
          contents: Cypress.Buffer.from(wallPhotoSvg),
          fileName: `wall-${unique}.svg`,
          mimeType: "image/svg+xml",
          lastModified: Date.now(),
        },
        { force: true },
      );

      cy.contains("button", "Post Photos").should("be.visible").click();
      cy.contains("Photos added").should("be.visible");
      cy.get('[data-testid="meet-wall-card"]').should(
        "have.length.at.least",
        cardCountBeforePhoto + 1,
      );
    });

    cy.get('[data-testid="meet-wall-card"]')
      .filter((_, card) => {
        return Cypress.$(card).find('img[alt="Meet wall post"]').length > 0;
      })
      .first()
      .within(() => {
        cy.get('button[aria-label="Favourite"]').click();
      });

    cy.get('[role="dialog"] .MuiDialogContent-root').scrollTo("top");
    cy.get('button[aria-label="Close meet details"]').click();
    cy.get('[role="dialog"]').should("not.exist");
    cy.logout();

    visitAttendeeWall(0);
    cy.contains("button", "Add Comment").click();
    cy.get('textarea[placeholder="Share your thoughts about the meet"]')
      .should("be.visible")
      .type(`Attendee one comment ${unique}`);
    cy.contains("button", "Post Comment").click();
    cy.contains(`Attendee one comment ${unique}`).should("be.visible");

    visitAttendeeWall(1);
    cy.get('button[aria-label="Rate Meet"]').should("be.visible").click();
    cy.get('input[name="meet-wall-rating"][value="4"]').check({ force: true });
    cy.get('textarea[placeholder="Add a comment with your rating"]')
      .should("be.visible")
      .type(`Attendee two rating comment ${unique}`);
    cy.contains("button", "Post Rating").click();
    cy.contains(`Attendee two rating comment ${unique}`).should("be.visible");

    visitAttendeeWall(2);
    cy.get('input[type="file"]').selectFile(
      Array.from({ length: 7 }, (_value, index) => ({
        contents: Cypress.Buffer.from(wallPhotoSvg),
        fileName: `attendee-three-${unique}-${index + 1}.svg`,
        mimeType: "image/svg+xml",
        lastModified: Date.now() + index,
      })),
      { force: true },
    );
    cy.get('textarea[placeholder="Add a comment with your photos"]')
      .should("be.visible")
      .type(`Attendee three photo post ${unique}`);
    cy.contains("button", "Post Photos").click();
    cy.contains("Photos added").should("be.visible");
    cy.contains(`Attendee three photo post ${unique}`).should("be.visible");

    loginAsOrganizer();
    cy.then(() => {
      expect(attendeeStatusUrls).to.have.length(3);
    });
    waitForClosedMeetInPast();
    openMeetDetails();
    cy.get('[role="dialog"] .MuiDialogContent-root').scrollTo("bottom");
    cy.contains(`Attendee one comment ${unique}`).scrollIntoView().should(
      "be.visible",
    );
    cy.contains(`Attendee two rating comment ${unique}`).scrollIntoView().should(
      "be.visible",
    );
    cy.contains(`Attendee three photo post ${unique}`).scrollIntoView().should(
      "be.visible",
    );
    cy.get('[role="dialog"] img[alt="Meet wall post"]').should(
      "have.length.at.least",
      1,
    );
  });
});
