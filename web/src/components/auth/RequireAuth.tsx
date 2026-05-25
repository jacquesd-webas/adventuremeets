import { CircularProgress, Stack } from "@mui/material";
import {
  Navigate,
  Outlet,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { MainLayoutOutletContext } from "../../layout/MainLayout";

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const outletContext = useOutletContext<MainLayoutOutletContext>();

  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "40vh" }}
      >
        <CircularProgress size={32} />
      </Stack>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return <Outlet context={outletContext} />;
}
