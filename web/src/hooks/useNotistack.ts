import { useSnackbar, OptionsObject } from "notistack";

type NoticeOptions = OptionsObject;

export function useNotistack() {
  const { enqueueSnackbar } = useSnackbar();

  const success = (message: string, options?: NoticeOptions) =>
    enqueueSnackbar(message, { variant: "success", ...options });
  const error = (message: string, options?: NoticeOptions) =>
    enqueueSnackbar(message, { variant: "error", ...options });
  const info = (message: string, options?: NoticeOptions) =>
    enqueueSnackbar(message, { variant: "info", ...options });
  const warn = (message: string, options?: NoticeOptions) =>
    enqueueSnackbar(message, { variant: "warning", ...options });

  return { success, error, info, warn };
}
