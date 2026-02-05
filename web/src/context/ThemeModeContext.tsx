import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

export type ThemeMode = "light" | "dark" | "glass";

type ThemeModeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

const getInitialMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem("themeMode");
  if (stored === "dark" || stored === "glass" || stored === "light") {
    return stored;
  }
  return "light";
};

type ThemeModeProviderProps = {
  children: React.ReactNode;
};

export function ThemeModeProvider({ children }: ThemeModeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(() => getInitialMode());

  useEffect(() => {
    document.body.setAttribute("data-theme", mode);
    window.localStorage.setItem("themeMode", mode);
  }, [mode]);

  const muiPaletteMode = mode === "dark" ? "dark" : "light";
  const theme = useMemo(
    () => createTheme({ palette: { mode: muiPaletteMode } }),
    [muiPaletteMode],
  );
  const toggleMode = () =>
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error("useThemeMode must be used within ThemeModeProvider");
  }

  return context;
}
