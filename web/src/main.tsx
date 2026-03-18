import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { NotistackProvider } from "./components/NotistackProvider";
import { ThemeModeProvider } from "./context/ThemeModeContext";
import { AuthProvider } from "./context/AuthProvider";
import { OrganizationProvider } from "./context/OrganizationProvider";
import { registerServiceWorker } from "./helpers/registerServiceWorker";
import "./styles.css";

const root = document.getElementById("root");

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
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <OrganizationProvider>
              <NotistackProvider>
                <App />
              </NotistackProvider>
            </OrganizationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeModeProvider>
  </React.StrictMode>
);

if (import.meta.env.PROD) {
  registerServiceWorker();
}
