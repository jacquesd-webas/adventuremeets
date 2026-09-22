import { useMemo } from "react";

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;

  const platform = navigator.platform || "";
  const userAgent = navigator.userAgent || "";
  const isTouchMac =
    platform === "MacIntel" &&
    (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1;

  return /iPad|iPhone|iPod/i.test(userAgent) || isTouchMac;
}

function isSafariBrowser() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  return (
    /Safari/i.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser/i.test(userAgent)
  );
}

export function useIosInstallInstructions() {
  const canShowInstructions = useMemo(() => {
    return isIosDevice() && isSafariBrowser() && !isStandaloneMode();
  }, []);

  return {
    canShowInstructions,
  };
}
