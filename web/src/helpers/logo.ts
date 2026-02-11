import { getOrganizationTheme } from "./organizationTheme";
import { ThemeMode } from "../context/ThemeModeContext";

export const getLogoSrc = (
  mode?: ThemeMode,
  organizationTheme?: string | null,
) => {
  const fallback =
    (typeof document !== "undefined" && document.body.getAttribute("data-theme")) ||
    (typeof window !== "undefined" && localStorage.getItem("themeMode")) ||
    "light";
  const resolved = mode ?? (fallback as ThemeMode);
  const fallbackTheme =
    organizationTheme ??
    (typeof document !== "undefined"
      ? document.body.getAttribute("data-org-theme")
      : null);
  const theme = getOrganizationTheme(fallbackTheme);
  const logoFile = resolved === "dark" ? theme.logoDark : theme.logoLight;
  return `/static/${logoFile}`;
};
