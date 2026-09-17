import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Me } from "../../types/MeModel";
import { organizationQueryKeys } from "../../hooks/organizationQueryKeys";
import { OrganizationProvider } from "../OrganizationProvider";
import { useCurrentOrganization } from "../organizationContext";

const get = vi.fn();
const auth = {
  user: null as Me | null,
  isLoading: false,
  meUpdatedAt: 1,
};

vi.mock("../../hooks/useApi", () => ({
  useApi: () => ({ get }),
}));

vi.mock("../authContext", () => ({
  useAuth: () => auth,
}));

describe("OrganizationProvider", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    get.mockReset();
    window.localStorage.clear();
    window.localStorage.setItem("currentOrganizationId", "org-1");
    auth.user = {
      id: "user-1",
      email: "member@example.com",
      organizations: { "org-1": "admin", "org-2": "member" },
    };
    auth.isLoading = false;
    auth.meUpdatedAt = 1;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderOrganization = () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <OrganizationProvider>{children}</OrganizationProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    return renderHook(
      () => ({
        organization: useCurrentOrganization(),
        navigate: useNavigate(),
      }),
      { wrapper },
    );
  };

  it("keeps the cached name while visiting a public route without fetching", async () => {
    get.mockResolvedValue({
      organization: { id: "org-1", name: "Mountain Club" },
    });
    const { result } = renderOrganization();

    await waitFor(() => {
      expect(result.current.organization.currentOrganizationName).toBe(
        "Mountain Club",
      );
    });

    act(() => result.current.navigate("/meets/shared-meet"));

    expect(result.current.organization.currentOrganizationId).toBe("org-1");
    expect(result.current.organization.currentOrganizationName).toBe(
      "Mountain Club",
    );
    expect(get).toHaveBeenCalledTimes(1);

    act(() => result.current.navigate("/"));

    expect(result.current.organization.currentOrganizationName).toBe(
      "Mountain Club",
    );
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it("retries an initially unauthorized organisation query after the session recovers", async () => {
    get.mockRejectedValueOnce(
      Object.assign(new Error("Unauthorized"), { status: 401 }),
    );
    const { result, rerender } = renderOrganization();

    await waitFor(() => {
      expect(
        queryClient.getQueryState(organizationQueryKeys.detail("org-1"))
          ?.status,
      ).toBe("error");
    });
    expect(result.current.organization.currentOrganizationId).toBe("org-1");

    get.mockResolvedValue({
      organization: { id: "org-1", name: "Mountain Club" },
    });
    auth.meUpdatedAt = 2;
    rerender();

    await waitFor(() => {
      expect(result.current.organization.currentOrganizationName).toBe(
        "Mountain Club",
      );
    });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("retains the name on a failed background refetch and accepts recovered data", async () => {
    get.mockResolvedValue({
      organization: { id: "org-1", name: "Mountain Club" },
    });
    const { result, rerender } = renderOrganization();

    await waitFor(() => {
      expect(result.current.organization.currentOrganizationName).toBe(
        "Mountain Club",
      );
    });

    get.mockRejectedValue(new Error("Service unavailable"));
    await act(() =>
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.detail("org-1"),
      }),
    );

    expect(result.current.organization.currentOrganizationName).toBe(
      "Mountain Club",
    );
    expect(window.localStorage.getItem("currentOrganizationId")).toBe("org-1");

    get.mockResolvedValue({
      organization: { id: "org-1", name: "Renamed Mountain Club" },
    });
    auth.meUpdatedAt = 2;
    rerender();

    await waitFor(() => {
      expect(result.current.organization.currentOrganizationName).toBe(
        "Renamed Mountain Club",
      );
    });
  });

  it("does not use another organisation's cached name while switching", async () => {
    get.mockResolvedValueOnce({
      organization: { id: "org-1", name: "Mountain Club" },
    });
    const { result } = renderOrganization();

    await waitFor(() => {
      expect(result.current.organization.currentOrganizationName).toBe(
        "Mountain Club",
      );
    });

    let resolveOrganization!: (response: unknown) => void;
    get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOrganization = resolve;
      }),
    );
    act(() => result.current.organization.setCurrentOrganizationId("org-2"));

    expect(result.current.organization.currentOrganizationId).toBe("org-2");
    expect(result.current.organization.currentOrganizationName).toBeNull();

    resolveOrganization({
      organization: { id: "org-2", name: "Paddling Club" },
    });
    await waitFor(() => {
      expect(result.current.organization.currentOrganizationName).toBe(
        "Paddling Club",
      );
    });
  });

  it("shares the in-flight recovery request when returning from a public route", async () => {
    get.mockResolvedValueOnce({
      organization: { id: "org-1", name: "Mountain Club" },
    });
    const { result } = renderOrganization();

    await waitFor(() => {
      expect(result.current.organization.currentOrganizationName).toBe(
        "Mountain Club",
      );
    });
    get.mockRejectedValueOnce(new Error("Service unavailable"));
    await act(() =>
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.detail("org-1"),
      }),
    );
    act(() => result.current.navigate("/meets/shared-meet"));

    let resolveOrganization!: (response: unknown) => void;
    get.mockReturnValue(
      new Promise((resolve) => {
        resolveOrganization = resolve;
      }),
    );
    act(() => result.current.navigate("/"));

    expect(get).toHaveBeenCalledTimes(3);
    expect(result.current.organization.currentOrganizationName).toBe(
      "Mountain Club",
    );

    resolveOrganization({
      organization: { id: "org-1", name: "Renamed Mountain Club" },
    });
    await waitFor(() => {
      expect(result.current.organization.currentOrganizationName).toBe(
        "Renamed Mountain Club",
      );
    });
  });

  it("clears the organisation name and selection on logout", async () => {
    get.mockResolvedValue({
      organization: { id: "org-1", name: "Mountain Club" },
    });
    const { result, rerender } = renderOrganization();

    await waitFor(() => {
      expect(result.current.organization.currentOrganizationName).toBe(
        "Mountain Club",
      );
    });

    auth.user = null;
    rerender();

    expect(result.current.organization.currentOrganizationName).toBeNull();
    expect(result.current.organization.currentOrganizationId).toBeNull();
    expect(window.localStorage.getItem("currentOrganizationId")).toBeNull();
    expect(get).toHaveBeenCalledTimes(1);
  });
});
