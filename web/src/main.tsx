import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { NotistackProvider } from "./components/NotistackProvider";
import { ThemeModeProvider } from "./context/ThemeModeContext";
import { AuthProvider } from "./context/AuthProvider";
import { OrganizationProvider } from "./context/OrganizationProvider";
import { FilterProvider } from "./context/FilterProvider";
import { registerServiceWorker } from "./helpers/registerServiceWorker";
import "./styles.css";

const root = document.getElementById("root");
const bootSplash = document.getElementById("boot-splash");

if (!root) {
  throw new Error("Root container missing in index.html");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
    },
  },
});

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeModeProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <OrganizationProvider>
              <FilterProvider>
                <NotistackProvider>
                  <App />
                </NotistackProvider>
              </FilterProvider>
            </OrganizationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeModeProvider>
  </React.StrictMode>,
);

if (bootSplash) {
  requestAnimationFrame(() => {
    bootSplash.classList.add("boot-splash-hidden");
    window.setTimeout(() => bootSplash.remove(), 240);
  });
}

if (import.meta.env.PROD) {
  registerServiceWorker();
}
