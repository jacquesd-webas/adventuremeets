import { registerSW } from "virtual:pwa-register";

export const registerServiceWorker = () => {
  if (typeof window === "undefined") return;

  try {
    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        registration?.update().catch(() => undefined);
      },
      onRegisterError(error) {
        console.error("Service worker registration failed", error);
      },
    });
  } catch (error) {
    console.error("Service worker bootstrap failed", error);
  }
};
