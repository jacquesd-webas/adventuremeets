import { SnackbarProvider } from "notistack";

type NotistackProviderProps = {
  children: React.ReactNode;
};

export function NotistackProvider({ children }: NotistackProviderProps) {
  return (
    <SnackbarProvider maxSnack={3} autoHideDuration={3500} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
      {children}
    </SnackbarProvider>
  );
}
