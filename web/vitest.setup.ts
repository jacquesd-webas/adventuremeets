import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    BrowserRouter: ({
      future,
      ...props
    }: React.ComponentProps<typeof actual.BrowserRouter>) =>
      React.createElement(actual.BrowserRouter, {
        ...props,
        future: { ...routerFutureFlags, ...future },
      }),
    MemoryRouter: ({
      future,
      ...props
    }: React.ComponentProps<typeof actual.MemoryRouter>) =>
      React.createElement(actual.MemoryRouter, {
        ...props,
        future: { ...routerFutureFlags, ...future },
      }),
  };
});
