describe("Invite to organisation", () => {
  it("registers a user, invites another user, and the invited user joins the organisation", () => {
    const unique = Date.now();
    const password = "Str0ng!Passw0rd2026";
    const inviterEmail = `cypress.org.owner.${unique}@example.com`;
    const inviteeEmail = `cypress.org.member.${unique}@example.com`;
    const inviterOrgName = `Invite Org ${unique}`;
    cy.intercept("POST", "**/api/v1/organizations/*/invites").as(
      "createInvite",
    );

    cy.visit("/register");
    cy.registerWithEmail({
      firstName: "Cypress",
      lastName: "Owner",
      phone: "5550001111",
      email: inviterEmail,
      password,
    });

    cy.url().should("match", /\/$/);
    cy.contains("Dashboard").should("be.visible");

    cy.get('[data-testid="account-menu-button"]').click();
    cy.get('[role="menu"]').should("be.visible");
    cy.contains('[role="menuitem"]', "Organisation").click();
    cy.get('[data-testid="organization-modal"]').should("be.visible");

    cy.contains("label", "Organisation name")
      .parent()
      .find("input")
      .clear()
      .type(inviterOrgName);
    cy.contains("button", "Save organisation").click();
    cy.contains("button", "Saved").should("be.visible");

    cy.get('[data-testid="organization-modal"]').contains("Invites").click();
    cy.contains("label", "Email").parent().find("input").type(inviteeEmail);
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, "writeText").as("writeInviteLink");
    });
    cy.contains("button", "Invite User").click();
    cy.wait("@createInvite").then((interception) => {
      const invite = interception.response?.body?.invite;
      expect(invite?.token, "invite token from create response").to.be.a(
        "string",
      ).and.not.be.empty;
      cy.window().then((win) => {
        const inviteLink = `${win.location.origin}/register?invite=${encodeURIComponent(
          invite.token,
        )}`;
        cy.wrap(inviteLink).as("inviteLink");
      });
    });
    cy.contains(inviteeEmail).should("be.visible");
    cy.get(`[aria-label="Copy invite link for ${inviteeEmail}"]`).click();
    cy.get("@writeInviteLink")
      .should("have.been.called")
      .then(() => undefined);

    cy.get('[data-testid="close-organization-modal"]').click();
    cy.get('[data-testid="organization-modal"]').should("not.exist");
    cy.logout();
    cy.wait(5000);
    cy.get("@inviteLink").then((inviteLink) => {
      cy.visit(String(inviteLink));
    });
    cy.registerWithEmail({
      firstName: "Cypress",
      lastName: "Member",
      phone: "5550002222",
      email: inviteeEmail,
      password,
    });

    cy.url().should("match", /\/$/);
    cy.contains("Pending invite").should("be.visible");
    cy.contains("button", "Yes").click();
    cy.contains("Pending invite").should("not.exist");
    cy.contains("Dashboard").should("be.visible");

    cy.get("body").then(($body) => {
      if ($body.find('[data-testid="organization-switcher-button"]').length) {
        cy.get('[data-testid="organization-switcher-button"]').click();
        cy.contains("Choose organisation").should("be.visible");
        cy.get('[role="combobox"]').click();
        cy.contains('[role="option"]', inviterOrgName).click();
        cy.contains("button", "Choose").click();
        cy.contains("Choose organisation").should("not.exist");
      }
    });

    cy.openProfileModal();
    cy.get('[data-testid="profile-modal"]').contains("Organisations").click();
    cy.contains(inviterOrgName).should("be.visible");
  });
});
