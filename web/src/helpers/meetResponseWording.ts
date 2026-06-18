export function getMeetResponseWording(isRsvpMode?: boolean) {
  if (isRsvpMode) {
    return {
      noun: "RSVP",
      nounLower: "rsvp",
      nounPlural: "RSVPs",
      countLabel: "RSVPs",
      pastVerb: "RSVP'd",
      actionNowLabel: "RSVP Now",
      submitLabel: "RSVP",
      submittedTitle: "RSVP submitted",
      submittedBody:
        "Your RSVP has been submitted. You will be notified by the organiser when meet attendance has been finalized.",
      viewLabel: "View your RSVP",
      viewStatusLabel: "View your RSVP status",
      statusPhrase: "the status of your RSVP",
      alreadySubmittedLabel: "You have already RSVP'd for this meet.",
      editLabel: "Edit RSVP",
      withdrawLabel: "Withdraw RSVP",
      duplicateTitle: "Already RSVP'd",
      duplicateBody:
        "You have already RSVP'd for this meet. If you wish to make changes to your RSVP, please use the link e-mailed to you. Alternately, you may contact the organiser directly to update or remove your RSVP.",
      emailMismatchLabel: "Email does not match meet RSVP",
      confirmEmailDescription:
        "Please confirm the email address you used for this RSVP.",
      confirmEmailPlaceholder: "Enter the email used for this RSVP",
      confirmEmailHelp:
        "Enter the email you used for this RSVP to continue.",
      withdrawPendingDescription: "Withdrawing will cancel your RSVP.",
      withdrawalStatusLead:
        "Use the link below to check the status of your RSVP.",
      withdrawalStatusLeadWithProfile:
        "If you wish you can create a profile to make future meet signups faster and manage your RSVPs. Alternatively just use the link below to check the status of your RSVP.",
      minorInviteMessage: "Please use this link to RSVP",
    };
  }

  return {
    noun: "application",
    nounLower: "application",
    nounPlural: "applications",
    countLabel: "Applied",
    pastVerb: "applied",
    actionNowLabel: "Apply Now",
    submitLabel: "Submit application",
    submittedTitle: "Application submitted",
    submittedBody:
      "Your application has been submitted. You will be notified by the organiser when meet attendance has been finalized.",
    viewLabel: "View your application",
    viewStatusLabel: "View your application status",
    statusPhrase: "the status of your application",
    alreadySubmittedLabel: "You have already applied for this meet.",
    editLabel: "Edit Application",
    withdrawLabel: "Withdraw application",
    duplicateTitle: "Already signed up",
    duplicateBody:
      "You have already signed up for this meet. If you wish to make changes to your application, please use the link e-mailed to you. Alternately, you may contact the organiser directly to update or remove your application.",
    emailMismatchLabel: "Email does not match meet application",
    confirmEmailDescription:
      "Please confirm the email address you used for this application.",
    confirmEmailPlaceholder: "Enter the email used for this application",
    confirmEmailHelp:
      "Enter the email you used for this application to continue.",
    withdrawPendingDescription: "Withdrawing will cancel your application.",
    withdrawalStatusLead:
      "Use the link below to check the status of your application.",
    withdrawalStatusLeadWithProfile:
      "If you wish you can create a profile to make future meet signups faster and manage your applications. Alternatively just use the link below to check the status of your application.",
    minorInviteMessage: "Please use this link to sign up",
  };
}
