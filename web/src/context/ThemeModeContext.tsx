import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

type ThemeMode = "light" | "dark";

type ThemeModeContextValue = {
  mode: ThemeMode;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

const getInitialMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem("themeMode");
  return stored === "dark" ? "dark" : "light";
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

  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);
  const toggleMode = () => setMode((prev) => (prev === "light" ? "dark" : "light"));
  const value = useMemo(() => ({ mode, toggleMode }), [mode]);

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
