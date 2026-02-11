import {
  DEFAULT_ORGANIZATION_THEME,
  ORGANIZATION_THEMES,
} from "../constants/themes";
import { ThemeMode } from "../context/ThemeModeContext";
import { OrganizationTheme } from "../types/themes";

export const getOrganizationTheme = (
  themeName?: string | null,
): OrganizationTheme => {
  if (!themeName) return DEFAULT_ORGANIZATION_THEME;
  return (
    ORGANIZATION_THEMES.find((theme) => theme.name === themeName) ??
    DEFAULT_ORGANIZATION_THEME
  );
};

export const getOrganizationBackground = (
  mode: ThemeMode,
  themeName?: string | null,
) => {
  const theme = getOrganizationTheme(themeName);
  const isDark = mode === "dark";
  return {
    image: isDark
      ? `/static/${theme.backgroundDark}`
      : `/static/${theme.backgroundLight}`,
    color: isDark ? theme.backgroundColorDark : theme.backgroundColorLight,
  };
};

export const getAllowedThemeModes = (
  themeName?: string | null,
): ThemeMode[] => {
  const theme = getOrganizationTheme(themeName);
  const modes: ThemeMode[] = [];
  if (theme.canLight) modes.push("light");
  if (theme.canDark) modes.push("dark");
  if (theme.canGlass) modes.push("glass");
  return modes.length ? modes : ["light"];
};
