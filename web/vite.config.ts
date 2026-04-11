import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBase = String(env.VITE_API_BASEURL || env.API_BASEURL || "")
    .replace(/\/+$/, "");
  const apiOrigin = apiBase.endsWith("/api/v1")
    ? apiBase.slice(0, -"/api/v1".length)
    : apiBase;

  const proxyTarget = apiOrigin || "http://localhost:8080";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      // Let `/share/:code` be served by the API so OG meta tags are present in the HTML response.
      proxy: {
        "/share": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
      host: true,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./vitest.setup.ts",
      include: ["src/**/t/*.{test,spec}.{ts,tsx}"],
    },
  };
});
