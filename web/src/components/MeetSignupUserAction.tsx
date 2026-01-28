import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FormEvent, useMemo, useState, MouseEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useLogin } from "../hooks/useLogin";

type MeetSignupUserActionProps = {
  formEmail?: string;
  onLoginClick?: () => void;
};

export function MismatchedUserDialog({ open }: { open: boolean }) {
  const { logout } = useAuth();
  return (
    <Dialog open={open} onClose={() => logout()}>
      <DialogTitle>Signed Out</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          You have automatically been signed out because the application for
          this meet is using a different e-mail address than the one you are
          currently signed in with.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Please sign in again with the correct e-mail address, or just continue
          anonymously.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          If you are having difficulty, please contact the meet organiser for
          assistance.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => logout()}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}

export function MeetSignupUserAction({
  formEmail,
  onLoginClick,
}: MeetSignupUserActionProps) {
  const { user, isAuthenticated, logout, refreshSession } = useAuth();
  const { loginAsync, isLoading, error } = useLogin();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loginAnchorEl, setLoginAnchorEl] = useState<null | HTMLElement>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState(formEmail || "");
  const [password, setPassword] = useState("");

  const displayName = useMemo(() => {
    if (!user) return "";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    if (name) return name;
    if (user.idp_profile?.name) return user.idp_profile.name;
    if (user.email) return user.email.split("@")[0];
    return "";
  }, [user]);

  const initials = useMemo(() => {
    if (!displayName) return "MP";
    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [displayName]);

  const handleAvatarClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);
  const handleLoginClose = () => {
    setLoginAnchorEl(null);
    setLoginOpen(false);
  };
  const handleLoginOpen = (event: MouseEvent<HTMLElement>) => {
    setLoginAnchorEl(event.currentTarget);
    setLoginOpen(true);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) return;
    await loginAsync({ email, password });
    await refreshSession();
    handleLoginClose();
  };

  const isMismatchedUser = Boolean(
    formEmail && user && formEmail !== user.email
  );

  if (isMismatchedUser) {
    return <MismatchedUserDialog open={true} />;
  }

  if (!isAuthenticated) {
    const loginForm = (
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2.5,
          width: isMobile ? "100%" : 280,
          mx: "auto",
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" fontWeight={600}>
            Login
          </Typography>
          <TextField
            size="small"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            disabled={formEmail !== undefined}
            fullWidth={isMobile}
          />
          <TextField
            size="small"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            fullWidth={isMobile}
          />
          {error ? (
            <Typography variant="caption" color="error">
              {error.message || "Login failed"}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button size="small" onClick={handleLoginClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="small"
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    );

    return (
      <>
        <Button
          variant="outlined"
          size="small"
          onClick={(event) => {
            onLoginClick?.();
            handleLoginOpen(event);
          }}
        >
          Login
        </Button>
        {isMobile ? (
          <Drawer anchor="bottom" open={loginOpen} onClose={handleLoginClose}>
            {loginForm}
          </Drawer>
        ) : (
          <Popover
            open={loginOpen}
            anchorEl={loginAnchorEl}
            onClose={handleLoginClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {loginForm}
          </Popover>
        )}
      </>
    );
  }

  return (
    <>
      <IconButton onClick={handleAvatarClick} size="small">
        <Avatar sx={{ width: 36, height: 36 }}>{initials}</Avatar>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </>
  );
}
