import { fireEvent, render, screen } from "@testing-library/react";
import { PasswordField } from "../PasswordField";

describe("PasswordField", () => {
  it("renders and updates value", () => {
    const onValueChange = vi.fn();
    render(
      <PasswordField label="Password" value="secret" onValueChange={onValueChange} />
    );

    const input = screen.getByLabelText("Password");
    fireEvent.change(input, { target: { value: "new-secret" } });

    expect(onValueChange).toHaveBeenCalledWith("new-secret");
  });

  it("toggles password visibility", () => {
    render(<PasswordField label="Password" value="secret" onValueChange={vi.fn()} />);

    const input = screen.getByLabelText("Password") as HTMLInputElement;
    expect(input.type).toBe("password");

    fireEvent.click(screen.getByLabelText("Show password"));
    expect(input.type).toBe("text");

    fireEvent.click(screen.getByLabelText("Hide password"));
    expect(input.type).toBe("password");
  });
});
