import { QueryClient } from "@tanstack/react-query";

export function invalidateMeetQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["meets"] });
  queryClient.invalidateQueries({ queryKey: ["meet"] });
}
