import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { OrganizationActions } from "../OrganizationActions";

describe("OrganizationActions", () => {
  it("renders manage links and calls edit/delete with organization id", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <OrganizationActions
          organizationId="org-123"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Organization actions" }),
    );

    expect(
      screen.getByRole("menuitem", { name: "Manage Users" }),
    ).toHaveAttribute("href", "/admin/organizations/org-123/members");
    expect(
      screen.getByRole("menuitem", { name: "Manage Templates" }),
    ).toHaveAttribute("href", "/admin/organizations/org-123/templates");

    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith("org-123");

    fireEvent.click(
      screen.getByRole("button", { name: "Organization actions" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("org-123");
    expect(alertSpy).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("disables the action button when disabled is true", () => {
    render(
      <MemoryRouter>
        <OrganizationActions organizationId="org-123" disabled />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: "Organization actions" }),
    ).toBeDisabled();
  });
});
