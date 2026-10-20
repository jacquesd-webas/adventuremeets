import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type PdfQuestion = {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: "text" | "select" | "checkbox";
  required: boolean;
  pdfFormFieldId: string;
  config: { options?: string[] };
};

export type PdfAutoField = {
  pdfFieldName: string;
  source:
    | "meetStartTime"
    | "meetEndTime"
    | "meetLocation"
    | "attendeeName"
    | "guardianName";
};

const templateKey = (meetId: string) => ["meet", meetId, "indemnity-template"];
const previewKey = (meetId: string) => [...templateKey(meetId), "preview"];

export function useIndemnityTemplate(meetId?: string | null) {
  const api = useApi();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: templateKey(meetId || ""),
    enabled: Boolean(meetId),
    queryFn: () =>
      api.get<{ filename: string; autoFields: PdfAutoField[] } | null>(
        `/meets/${meetId}/indemnity-template`,
      ),
  });
  const preview = useQuery({
    queryKey: previewKey(meetId || ""),
    enabled: Boolean(meetId && query.data?.filename),
    queryFn: () => api.getBlob(`/meets/${meetId}/indemnity-template/preview`),
  });
  const upload = useMutation({
    mutationFn: (file: File) => {
      if (!meetId) throw new Error("Save the meet before uploading a form");
      const body = new FormData();
      body.append("file", file);
      return api.postForm<{
        filename: string;
        questions: PdfQuestion[];
        autoFields: PdfAutoField[];
      }>(`/meets/${meetId}/indemnity-template`, body);
    },
    onSuccess: (result) => {
      if (!meetId) return;
      queryClient.setQueryData(templateKey(meetId), {
        filename: result.filename,
        autoFields: result.autoFields,
      });
      queryClient.setQueryData(previewKey(meetId), null);
      queryClient.invalidateQueries({ queryKey: previewKey(meetId) });
      queryClient.invalidateQueries({
        queryKey: ["meet", meetId],
        exact: true,
      });
    },
  });
  const remove = useMutation({
    mutationFn: () => {
      if (!meetId) throw new Error("Save the meet before changing its form");
      return api.del<{ deleted: boolean }>(
        `/meets/${meetId}/indemnity-template`,
      );
    },
    onSuccess: () => {
      if (!meetId) return;
      queryClient.setQueryData(templateKey(meetId), null);
      queryClient.setQueryData(previewKey(meetId), null);
      queryClient.invalidateQueries({
        queryKey: ["meet", meetId],
        exact: true,
      });
    },
  });
  return {
    template: query.data,
    isLoading: query.isLoading,
    preview: preview.data,
    isLoadingPreview: preview.isLoading,
    previewError: preview.error,
    upload,
    remove,
  };
}
