import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";
import type { ReportFilters, ReportResponse } from "../types/Report";

export const reportQueryKeys = {
  all: ["reports"] as const,
  results: (filters: ReportFilters) => ["reports", filters] as const,
};

export function useReportQuery(filters: ReportFilters, enabled: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: reportQueryKeys.results(filters),
    enabled,
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "") params.set(key, String(value));
      });
      return api.get<ReportResponse>(`/reports?${params.toString()}`);
    },
  });
}
