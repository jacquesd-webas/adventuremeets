import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { AdminActionsMenu } from "../AdminActionsMenu";

describe("AdminActionsMenu", () => {
  it("calls edit and delete actions when clicked", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<AdminActionsMenu onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("disables menu items when handlers are missing", () => {
    render(<AdminActionsMenu />);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
