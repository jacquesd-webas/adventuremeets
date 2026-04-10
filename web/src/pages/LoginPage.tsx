import {
  Box,
  Container,
  Drawer,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { getLogoSrc } from "../helpers/logo";
import { LoginForm } from "../components/auth/LoginForm";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const logoSrc = getLogoSrc();
  const nav = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: isMobile ? 4 : 8,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <img
            src={logoSrc}
            alt="AdventureMeets logo"
            width={isMobile ? 260 : 320}
            height="auto"
          />
        </Box>
        {!isMobile && (
          <Paper elevation={2} sx={{ width: "100%", p: 3 }}>
            <LoginForm
              showSocialButtons
              showFooterLinks
              onSuccess={() => nav("/", { replace: true })}
            />
          </Paper>
        )}
      </Container>
      {isMobile && (
        <Drawer
          anchor="bottom"
          open={true}
          onClose={(_event, reason) => {
            if (reason === "backdropClick" || reason === "escapeKeyDown")
              return;
          }}
          disableEscapeKeyDown
          slotProps={{
            backdrop: {
              sx: { backgroundColor: "rgba(0,0,0,0.35)" },
            },
          }}
          ModalProps={{
            keepMounted: true,
            disableAutoFocus: true,
            disableEnforceFocus: true,
            disableRestoreFocus: true,
          }}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "78vh",
              overflowY: "auto",
              pb: "calc(16px + env(safe-area-inset-bottom))",
            },
          }}
        >
          <Box sx={{ px: 2, pt: 2, pb: 2.5 }}>
            <LoginForm
              showSocialButtons
              showFooterLinks
              onSuccess={() => nav("/", { replace: true })}
            />
          </Box>
        </Drawer>
      )}
    </Box>
  );
}

export default LoginPage;
