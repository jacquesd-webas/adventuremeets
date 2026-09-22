import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { Me } from "../types/MeModel";

type UploadMyAvatarPayload = {
  file: File;
};

export function useUploadMyAvatar() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<{ user: Me }, Error, UploadMyAvatarPayload>({
    mutationFn: async ({ file }) => {
      const body = new FormData();
      body.append("file", file);
      return api.postForm<{ user: Me }>("/users/me/avatar", body);
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["auth", "me"], (current?: Me | null) => ({
        ...(current ?? {}),
        ...result.user,
      }));
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  return {
    uploadMyAvatarAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
