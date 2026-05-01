import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetInfoSummary } from "../MeetInfoSummary";

vi.mock("../../../context/authContext", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

vi.mock("../MeetInfoDeets", () => ({
  MeetInfoDeets: () => <div>Meet details</div>,
}));

describe("MeetInfoSummary", () => {
  const originalResizeObserver = globalThis.ResizeObserver;
  const originalScrollHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollHeight",
  );
  const originalClientHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientHeight",
  );

  beforeEach(() => {
    class ResizeObserverMock {
      observe() {}
      disconnect() {}
      unobserve() {}
    }

    globalThis.ResizeObserver = ResizeObserverMock as any;
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    if (originalScrollHeight) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollHeight",
        originalScrollHeight,
      );
    } else {
      delete (HTMLElement.prototype as any).scrollHeight;
    }
    if (originalClientHeight) {
      Object.defineProperty(
        HTMLElement.prototype,
        "clientHeight",
        originalClientHeight,
      );
    } else {
      delete (HTMLElement.prototype as any).clientHeight;
    }
  });

  it("opens an image carousel when the preview image is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MeetInfoSummary
        meet={{
          id: "meet-1",
          name: "Mountain Hike",
          imageUrl: "https://cdn.example.com/primary.jpg",
          images: [
            {
              id: "image-1",
              meetId: "meet-1",
              url: "https://cdn.example.com/primary.jpg",
              isPrimary: true,
              aspect: "W",
            },
            {
              id: "image-2",
              meetId: "meet-1",
              url: "https://cdn.example.com/secondary.jpg",
              isPrimary: false,
              aspect: "O",
            },
          ],
        }}
        isPreview={false}
      />,
    );

    expect(screen.getByText("+1")).toBeInTheDocument();

    await user.click(screen.getByAltText("Meet preview"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByAltText("Mountain Hike image 1")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Next image"));

    expect(screen.getByAltText("Mountain Hike image 2")).toBeInTheDocument();
  });

  it("shows the show more chip when the description is truncated", async () => {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 120,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get: () => 60,
    });

    render(
      <MeetInfoSummary
        meet={{
          id: "meet-2",
          name: "Long Description Meet",
          description:
            "This is a long description that should overflow the clamped text area.",
        }}
        isPreview={false}
        maxDescriptionLines={2}
      />,
    );

    expect(await screen.findByText("show more")).toBeInTheDocument();
  });
});
