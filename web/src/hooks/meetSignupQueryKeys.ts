export const meetSignupQueryKeys = {
  previousAnswers: (meetId?: string, userId?: string, isMinor = false) =>
    ["meet-signup", meetId, "previous-answers", userId, isMinor] as const,
};
