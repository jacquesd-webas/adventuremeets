import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBase = String(env.VITE_API_BASEURL || env.API_BASEURL || "")
    .replace(/\/+$/, "");
  const apiOrigin = apiBase.endsWith("/api/v1")
    ? apiBase.slice(0, -"/api/v1".length)
    : apiBase;

  const proxyTarget = apiOrigin || "http://localhost:8080";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: false,
        manifest: false,
        includeAssets: [
          "favicon.svg",
          "apple-touch-icon.png",
          "icons/*.png",
          "static/*.png",
          "static/*.svg",
        ],
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: [
            "**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,webmanifest}",
          ],
          globIgnores: ["**/static/splash/*.png", "**/static/themes/*.png"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//, /^\/share\//],
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                url.origin === self.location.origin &&
                ["script", "style", "worker", "font"].includes(
                  request.destination,
                ),
              handler: "CacheFirst",
              options: {
                cacheName: "static-assets",
                cacheableResponse: {
                  statuses: [200],
                },
                expiration: {
                  maxEntries: 96,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: ({ request, url }) =>
                url.origin === self.location.origin &&
                request.destination === "image",
              handler: "CacheFirst",
              options: {
                cacheName: "static-images",
                cacheableResponse: {
                  statuses: [200],
                },
                expiration: {
                  maxEntries: 128,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: ({ request, url }) =>
                url.origin === self.location.origin &&
                request.destination === "manifest",
              handler: "CacheFirst",
              options: {
                cacheName: "app-manifest",
                cacheableResponse: {
                  statuses: [200],
                },
              },
            },
          ],
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 2500,
    },
    server: {
      port: 5173,
      host: true,
      // Let `/share/:code` be served by the API so OG meta tags are present in the HTML response.
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
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
