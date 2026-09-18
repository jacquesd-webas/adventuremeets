import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { organizationQueryKeys } from "../../hooks/organizationQueryKeys";
import { OrganizationSwitcherButton } from "../OrganizationSwitcherButton";

const get = vi.fn();
const auth = {
  user: { id: "user-1" } as { id: string } | null,
  meUpdatedAt: 1,
};
const organization = {
  currentOrganizationId: "org-1" as string | null,
  organizationIds: ["org-1", "org-2"],
};

vi.mock("../../hooks/useApi", () => ({ useApi: () => ({ get }) }));
vi.mock("../../context/authContext", () => ({ useAuth: () => auth }));
vi.mock("../../context/organizationContext", () => ({
  useCurrentOrganization: () => organization,
}));

describe("OrganizationSwitcherButton", () => {
  let client: QueryClient;
  const onClick = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    get.mockReset();
    onClick.mockReset();
    window.localStorage.clear();
    auth.user = { id: "user-1" };
    organization.currentOrganizationId = "org-1";
    organization.organizationIds = ["org-1", "org-2"];
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    cleanup();
    client.clear();
    vi.useRealTimers();
  });

  const renderButton = () =>
    render(
      <QueryClientProvider client={client}>
        <OrganizationSwitcherButton onClick={onClick} />
      </QueryClientProvider>,
    );

  const advance = async (milliseconds = 1) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(milliseconds);
    });
  };

  it.each(["unauthorized", "empty"])(
    "recovers a %s response without another session update and stops refreshing after success",
    async (failure) => {
      if (failure === "unauthorized") {
        get.mockRejectedValueOnce(
          Object.assign(new Error("Unauthorized"), { status: 401 }),
        );
      } else {
        get.mockResolvedValueOnce({ organization: null });
      }
      get.mockResolvedValue({
        organization: { id: "org-1", name: "Mountain Club" },
      });
      renderButton();
      await advance();

      expect(screen.getByRole("button")).toHaveTextContent("Organisation");
      expect(get).toHaveBeenCalledTimes(1);
      await advance(10_001);

      expect(screen.getByRole("button")).toHaveTextContent("Mountain Club");
      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "false");
      expect(get).toHaveBeenLastCalledWith("/organizations/org-1");
      expect(get).toHaveBeenCalledTimes(2);
      await advance(30_000);
      expect(get).toHaveBeenCalledTimes(2);
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledOnce();
    },
  );

  it("keeps the cached name when a background refresh fails", async () => {
    client.setQueryData(organizationQueryKeys.detail("org-1"), {
      id: "org-1",
      name: "Mountain Club",
    });
    get.mockRejectedValue(new Error("Unauthorized"));
    renderButton();
    await advance();

    expect(screen.getByRole("button")).toHaveTextContent("Mountain Club");
    await advance(30_000);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("uses the stored name while recovering the organisation request", async () => {
    window.localStorage.setItem(
      "organizationNames",
      JSON.stringify({ "org-1": "Mountain Club" }),
    );
    get.mockRejectedValue(new Error("Unauthorized"));
    renderButton();
    await advance();

    expect(screen.getByRole("button")).toHaveTextContent("Mountain Club");
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("loads the newly selected organisation without showing the old name", async () => {
    get.mockResolvedValue({
      organization: { id: "org-1", name: "Mountain Club" },
    });
    const { rerender } = renderButton();
    await advance();
    expect(screen.getByRole("button")).toHaveTextContent("Mountain Club");

    organization.currentOrganizationId = "org-2";
    get.mockResolvedValue({
      organization: { id: "org-2", name: "Paddling Club" },
    });
    rerender(
      <QueryClientProvider client={client}>
        <OrganizationSwitcherButton onClick={onClick} />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("button")).not.toHaveTextContent("Mountain Club");
    await advance();
    expect(screen.getByRole("button")).toHaveTextContent("Paddling Club");
    expect(get).toHaveBeenLastCalledWith("/organizations/org-2");
  });

  it("does not request an organisation without a selection", async () => {
    organization.currentOrganizationId = null;
    renderButton();
    await advance(30_000);
    expect(screen.getByRole("button")).toHaveTextContent("No Organisation");
    expect(get).not.toHaveBeenCalled();
  });

  it("stops recovery when the user logs out", async () => {
    get.mockRejectedValue(new Error("Unauthorized"));
    const { rerender } = renderButton();
    await advance();
    auth.user = null;
    rerender(
      <QueryClientProvider client={client}>
        <OrganizationSwitcherButton onClick={onClick} />
      </QueryClientProvider>,
    );
    await advance(30_000);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(1);
  });
});
