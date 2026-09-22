import { createContext, useContext } from "react";

export type DashboardView = "my" | "all";
export type ListPageView = "draft" | "upcoming" | "past";

export type FilterContextValue = {
  dashboardView: DashboardView;
  listPageView: ListPageView;
  setDashboardView: (view: DashboardView) => void;
  setListPageView: (view: ListPageView) => void;
};

export const FilterContext = createContext<FilterContextValue | undefined>(
  undefined,
);

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within FilterProvider");
  }
  return context;
}
