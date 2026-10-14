import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { UserSelect } from "../UserSelect";

const options = [
  { id: "alice", label: "Alice Jones" },
  { id: "grace", label: "Grace Hopper" },
  { id: "alan", label: "Alan Turing" },
];

describe("UserSelect", () => {
  it("searches organisers and returns the selected user ID", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <UserSelect
        value="alice"
        onChange={onChange}
        options={options}
        currentUserId="alice"
      />,
    );

    const input = screen.getByRole("combobox", { name: "Organiser" });
    expect(input).toHaveValue("You (Alice Jones)");

    await user.clear(input);
    await user.type(input, "grace");

    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "Grace Hopper" })).toBeInTheDocument();
    expect(within(listbox).queryByRole("option", { name: "Alan Turing" })).not.toBeInTheDocument();

    await user.click(within(listbox).getByRole("option", { name: "Grace Hopper" }));
    expect(onChange).toHaveBeenCalledWith("grace");
  });

  it("preserves validation help and prevents changes when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <UserSelect
        value="alice"
        onChange={onChange}
        options={options}
        error
        helperText="Please select an organiser"
        disabled
      />,
    );

    const input = screen.getByRole("combobox", { name: "Organiser" });
    expect(input).toBeDisabled();
    expect(screen.getByText("Please select an organiser")).toBeInTheDocument();
    await user.click(input);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
