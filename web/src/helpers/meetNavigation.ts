import { NavigateFunction } from "react-router-dom";

function isSafeReturnToPath(path?: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//"));
}

function navigateToPath(navigate: NavigateFunction, path: string) {
  if (
    typeof window !== "undefined" &&
    import.meta.env.MODE !== "test" &&
    (typeof navigator === "undefined" || !/jsdom/i.test(navigator.userAgent))
  ) {
    window.location.assign(path);
    return;
  }

  navigate(path);
}

export function getMeetCheckinReturnTo(path?: string | null): string {
  return isSafeReturnToPath(path) ? path : "/";
}

export function buildMeetCheckinPath(meetId: string, returnTo?: string | null) {
  const params = new URLSearchParams();
  const safeReturnTo = getMeetCheckinReturnTo(returnTo);

  if (safeReturnTo !== "/") {
    params.set("returnTo", safeReturnTo);
  }

  const search = params.toString();
  return `/meet/${meetId}/checkin${search ? `?${search}` : ""}`;
}

export function buildMeetSignupPath(
  shareCode: string,
  options?: { isPreview?: boolean },
) {
  const params = new URLSearchParams();

  if (options?.isPreview) {
    params.set("preview", "true");
  }

  const search = params.toString();
  return `/meets/${shareCode}${search ? `?${search}` : ""}`;
}

export function navigateToMeetCheckin({
  meetId,
  navigate,
  returnTo,
}: {
  meetId: string;
  navigate: NavigateFunction;
  returnTo?: string | null;
}) {
  navigateToPath(navigate, buildMeetCheckinPath(meetId, returnTo));
}

export function navigateToMeetSignup({
  shareCode,
  navigate,
  isPreview,
}: {
  shareCode: string;
  navigate: NavigateFunction;
  isPreview?: boolean;
}) {
  navigateToPath(navigate, buildMeetSignupPath(shareCode, { isPreview }));
}
