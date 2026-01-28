import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { NotistackProvider } from "./components/NotistackProvider";
import { ThemeModeProvider } from "./context/ThemeModeContext";
import { AuthProvider } from "./context/AuthContext";
import { OrganizationProvider } from "./context/OrganizationContext";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root container missing in index.html");
}

const queryClient = new QueryClient();

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
