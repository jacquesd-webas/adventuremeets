import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import MembersPage from "../MembersPage";

const members = [
  {
    id: "1",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    role: "admin",
    status: "active",
  },
  {
    id: "2",
    firstName: "Grace",
    lastName: "Hopper",
    email: "grace@example.com",
    role: "organizer",
    status: "active",
  },
  {
    id: "3",
    firstName: "Alan",
    lastName: "Turing",
    email: "alan@example.com",
    role: "member",
    status: "active",
  },
];

vi.mock("../../context/organizationContext", () => ({
  useCurrentOrganization: () => ({ currentOrganizationId: "org-1" }),
}));

vi.mock("../../hooks/useFetchOrganizationMembers", () => ({
  useFetchOrganizationMembers: () => ({
    data: members,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useFetchOrganization", () => ({
  useFetchOrganization: () => ({ data: { name: "Example Club" } }),
}));

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows, paginationModel, onPaginationModelChange }: any) => (
    <div data-testid="members-grid">
      {rows.map((member: (typeof members)[number]) => (
        <div key={member.id}>
          {member.firstName} {member.lastName} {member.email}
        </div>
      ))}
      <span>Page {paginationModel.page}</span>
      <button
        onClick={() => onPaginationModelChange({ ...paginationModel, page: 2 })}
      >
        Go to page 2
      </button>
    </div>
  ),
}));

vi.mock("../../components/admin/EditUsersModal", () => ({
  EditUsersModal: () => null,
}));

describe("MembersPage filters", () => {
  it("searches names and email addresses, ignoring case", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MembersPage />
      </MemoryRouter>,
    );

    const search = screen.getByRole("textbox", { name: "Search members" });
    await user.type(search, "ADA LOVELACE");
    expect(
      within(screen.getByTestId("members-grid")).getByText(/Ada Lovelace/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Grace Hopper/)).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "grace@example.com");
    expect(
      within(screen.getByTestId("members-grid")).getByText(/Grace Hopper/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Ada Lovelace/)).not.toBeInTheDocument();
  });

  it("combines the role filter with search and resets pagination", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MembersPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(screen.getByText("Page 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Organizers" }));
    expect(screen.getByText("Page 0")).toBeInTheDocument();
    expect(screen.getByText(/Grace Hopper/)).toBeInTheDocument();
    expect(screen.queryByText(/Ada Lovelace/)).not.toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "Search members" }),
      "Ada",
    );
    expect(screen.queryByText(/Grace Hopper/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText(/Ada Lovelace/)).toBeInTheDocument();
  });
});
