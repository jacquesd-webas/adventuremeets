import { render, screen } from "@testing-library/react";
import { PasswordStrength } from "../PasswordStrength";

describe("PasswordStrength", () => {
  it("renders label and strength text", () => {
    render(<PasswordStrength label="Strong" percent={80} score={4} />);

    expect(screen.getByText("Password strength")).toBeInTheDocument();
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });
});
