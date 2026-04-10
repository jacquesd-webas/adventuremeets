const PUBLIC_PATH_PREFIXES = ["/splash", "/privacy", "/tnc"];

export function isPublicRoutePath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

