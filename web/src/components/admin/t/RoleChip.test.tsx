import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RoleChip } from "../RoleChip";

describe("RoleChip", () => {
  it("renders member when role is missing", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleChip />
      </QueryClientProvider>,
    );
    expect(screen.getByText("member")).toBeInTheDocument();
  });

  it("normalizes role casing", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RoleChip role="AdMiN" />
      </QueryClientProvider>,
    );
    expect(screen.getByText("admin")).toBeInTheDocument();
  });
});
