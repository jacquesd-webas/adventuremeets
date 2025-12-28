import { render, screen, fireEvent } from "@testing-library/react";
import { EmailField } from "../EmailField";

describe("EmailField", () => {
  it("renders label and propagates changes", () => {
    const handleChange = vi.fn();
    render(<EmailField value="" onChange={handleChange} />);

    const input = screen.getByLabelText(/Email/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "user@example.com" } });
    expect(handleChange).toHaveBeenCalledWith("user@example.com");
  });
});
