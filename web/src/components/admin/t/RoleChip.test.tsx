import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RoleChip } from "../RoleChip";

describe("RoleChip", () => {
  it("renders member when role is missing", () => {
    render(<RoleChip />);
    expect(screen.getByText("member")).toBeInTheDocument();
  });

  it("normalizes role casing", () => {
    render(<RoleChip role="AdMiN" />);
    expect(screen.getByText("admin")).toBeInTheDocument();
  });
});
