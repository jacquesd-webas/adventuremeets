import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { EditUsersModal } from "../EditUsersModal";

const updateMemberAsync = vi.fn();

vi.mock("../../../hooks/useUpdateOrganizationMember", () => ({
  useUpdateOrganizationMember: () => ({
    updateMemberAsync,
    isLoading: false,
    error: null,
  }),
}));

describe("EditUsersModal", () => {
  const member = {
    id: "user-1",
    email: "member@example.com",
    firstName: "Test",
    lastName: "Member",
    role: "member",
    status: "active",
  };

  beforeEach(() => {
    updateMemberAsync.mockReset();
  });

  it("disables save when there are no changes", () => {
    render(
      <EditUsersModal
        open
        onClose={vi.fn()}
        member={member}
        organizationId="org-1"
      />,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("saves updated values and closes", async () => {
    const onClose = vi.fn();
    updateMemberAsync.mockResolvedValue(undefined);

    render(
      <EditUsersModal
        open
        onClose={onClose}
        member={member}
        organizationId="org-1"
      />,
    );

    fireEvent.mouseDown(screen.getByLabelText("Role"));
    fireEvent.click(screen.getByRole("option", { name: "admin" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateMemberAsync).toHaveBeenCalledWith({
        organizationId: "org-1",
        userId: "user-1",
        role: "admin",
        status: "active",
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("toggles status with the switch", () => {
    render(
      <EditUsersModal
        open
        onClose={vi.fn()}
        member={member}
        organizationId="org-1"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });
});
