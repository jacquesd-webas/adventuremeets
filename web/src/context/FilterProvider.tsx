import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  DashboardView,
  FilterContext,
  FilterContextValue,
  ListPageView,
} from "./filterContext";

type FilterProviderProps = {
  children: ReactNode;
};

const storageKey = "filterContext";

function isDashboardView(value: unknown): value is DashboardView {
  return value === "my" || value === "all";
}

function isListPageView(value: unknown): value is ListPageView {
  return value === "draft" || value === "upcoming" || value === "past";
}

function readStoredFilters(): {
  dashboardView: DashboardView;
  listPageView: ListPageView;
} {
  const defaults = { dashboardView: "all" as DashboardView, listPageView: "upcoming" as ListPageView };
  if (typeof window === "undefined") return defaults;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as {
      dashboardView?: unknown;
      listPageView?: unknown;
    };

    return {
      dashboardView: isDashboardView(parsed.dashboardView)
        ? parsed.dashboardView
        : defaults.dashboardView,
      listPageView: isListPageView(parsed.listPageView)
        ? parsed.listPageView
        : defaults.listPageView,
    };
  } catch {
    return defaults;
  }
}

export function FilterProvider({ children }: FilterProviderProps) {
  const initialFilters = readStoredFilters();
  const [dashboardView, setDashboardView] = useState<DashboardView>(
    initialFilters.dashboardView,
  );
  const [listPageView, setListPageView] = useState<ListPageView>(
    initialFilters.listPageView,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ dashboardView, listPageView }),
    );
  }, [dashboardView, listPageView]);

  const value = useMemo<FilterContextValue>(
    () => ({
      dashboardView,
      listPageView,
      setDashboardView,
      setListPageView,
    }),
    [dashboardView, listPageView],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}
