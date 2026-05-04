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

export function isPublicRoutePath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
