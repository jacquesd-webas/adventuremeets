import { fireEvent, render, screen } from "@testing-library/react";
import { AuthSocialButtons } from "../AuthSocialButtons";

describe("AuthSocialButtons", () => {
  it("calls onSelect when Google is clicked", () => {
    const onSelect = vi.fn();

    render(<AuthSocialButtons onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(onSelect).toHaveBeenCalledWith("google");
  });

  it("keeps Facebook disabled", () => {
    render(<AuthSocialButtons />);

    expect(
      screen.getByRole("button", { name: "Continue with Facebook" }),
    ).toBeDisabled();
  });
});
