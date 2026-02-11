import { fireEvent, render, screen } from "@testing-library/react";
import { NameField } from "../NameField";

describe("NameField", () => {
  it("renders and updates value", () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(
      <NameField
        label="Full name"
        value="Alex"
        onChange={onChange}
        onBlur={onBlur}
      />
    );

    const input = screen.getByLabelText(/Full name/i);
    fireEvent.change(input, { target: { value: "Taylor" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith("Taylor");
    expect(onBlur).toHaveBeenCalled();
  });
});
