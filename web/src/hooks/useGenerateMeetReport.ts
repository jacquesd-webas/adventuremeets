import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

type GenerateMeetReportPayload = {
  meetId: string;
  sendEmail: boolean;
  downloadReport: boolean;
  isFinalReport?: boolean;
};

export function useGenerateMeetReport() {
  const api = useApi();

  const mutation = useMutation<Blob | null, Error, GenerateMeetReportPayload>({
    mutationFn: async ({
      meetId,
      sendEmail,
      downloadReport,
      isFinalReport = true,
    }) => {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("accessToken")
          : null;
      const res = await fetch(`${api.baseUrl}/meets/${meetId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sendEmail, downloadReport, isFinalReport }),
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || `Request failed with status ${res.status}`);
      }
      if (downloadReport) {
        return res.blob();
      }
      return null;
    },
  });

  return {
    generateReport: mutation.mutate,
    generateReportAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
