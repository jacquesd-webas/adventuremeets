import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UserStatusChip } from "../UserStatusChip";

describe("UserStatusChip", () => {
  it("shows Verified when user email is verified", () => {
    render(
      <UserStatusChip user={{ id: "u1", emailVerified: true, isDisabled: false }} />,
    );
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("shows Disabled when user is disabled", () => {
    render(
      <UserStatusChip user={{ id: "u1", emailVerified: true, isDisabled: true }} />,
    );
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("shows Pending by default", () => {
    render(<UserStatusChip user={{ id: "u1" }} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
