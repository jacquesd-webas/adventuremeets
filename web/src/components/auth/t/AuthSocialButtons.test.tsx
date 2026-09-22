import { fireEvent, render, screen } from "@testing-library/react";
import { AuthSocialButtons } from "../AuthSocialButtons";

describe("AuthSocialButtons", () => {
  it("calls onSelect when Google is clicked", () => {
    const onSelect = vi.fn();

    render(<AuthSocialButtons onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(onSelect).toHaveBeenCalledWith("google");
  });

  it("calls onSelect when Facebook is clicked", () => {
    const onSelect = vi.fn();

    render(<AuthSocialButtons onSelect={onSelect} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Facebook" }),
    );

    expect(onSelect).toHaveBeenCalledWith("facebook");
  });

  it("calls onSelect when compact Facebook is clicked", () => {
    const onSelect = vi.fn();

    render(<AuthSocialButtons compact onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Facebook" }));

    expect(onSelect).toHaveBeenCalledWith("facebook");
  });
});
