import { fireEvent, render, screen } from "@testing-library/react";
import { EmailField } from "../EmailField";

describe("EmailField", () => {
  it("renders and updates value", () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(
      <EmailField value="test@example.com" onChange={onChange} onBlur={onBlur} />
    );

    const input = screen.getByLabelText(/Email/i);
    fireEvent.change(input, { target: { value: "new@example.com" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith("new@example.com");
    expect(onBlur).toHaveBeenCalled();
  });
});
