import { fireEvent, render, screen } from "@testing-library/react";
import { MeetSignupDuplicateDialog } from "../MeetSignupDuplicateDialog";

describe("MeetSignupDuplicateDialog", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it("renders and closes", () => {
    const onClose = vi.fn();
    render(
      <MeetSignupDuplicateDialog
        open
        onClose={onClose}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: /Already signed up/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
