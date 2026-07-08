import { render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import SplashPage from "../SplashPage";

vi.mock("../../components/splash/SplashActivityCarousel", () => ({
  SplashActivityCarousel: () => <div>Carousel</div>,
}));

vi.mock("../../components/splash/IosInstallInstructionsDialog", () => ({
  IosInstallInstructionsDialog: () => null,
}));

vi.mock("../../hooks/useAndroidInstallPrompt", () => ({
  useAndroidInstallPrompt: () => ({
    canInstall: false,
    promptInstall: vi.fn(),
  }),
}));

const iosHookState = vi.hoisted(() => ({
  canShowInstructions: false,
}));

vi.mock("../../hooks/useIosInstallInstructions", () => ({
  useIosInstallInstructions: () => iosHookState,
}));

describe("SplashPage", () => {
  afterEach(() => {
    iosHookState.canShowInstructions = false;
  });

  it("does not show install buttons on normal browsers", () => {
    render(<SplashPage />);

    expect(
      screen.queryByRole("button", { name: "Install App" }),
    ).not.toBeInTheDocument();
  });

  it("shows the iOS install button only when iOS instructions are available", () => {
    iosHookState.canShowInstructions = true;

    render(<SplashPage />);

    expect(
      screen.getByRole("button", { name: "Install App" }),
    ).toBeInTheDocument();
  });
});
