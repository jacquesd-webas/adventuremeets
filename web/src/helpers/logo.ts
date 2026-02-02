export const getLogoSrc = (mode?: "light" | "dark") => {
  const fallback =
    (typeof document !== "undefined" && document.body.getAttribute("data-theme")) ||
    (typeof window !== "undefined" && localStorage.getItem("themeMode")) ||
    "light";
  const resolved = mode ?? (fallback as "light" | "dark");
  return resolved === "dark"
    ? "/static/adventuremeets-logo-dark.svg"
    : "/static/adventuremeets-logo.svg";
};
