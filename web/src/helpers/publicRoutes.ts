const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/oauth/callback/google",
  "/oauth/callback/facebook",
  "/splash",
  "/privacy",
  "/request-account-deletion",
  "/tnc",
];

function isPublicMeetRoute(pathname: string) {
  if (!pathname.startsWith("/meets/") && !pathname.startsWith("/share/")) {
    return false;
  }

  const parts = pathname.split("/").filter(Boolean);

  return parts.length === 2 || parts.length === 3;
}

export function isPublicRoutePath(pathname: string) {
  return (
    isPublicMeetRoute(pathname) ||
    PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}
