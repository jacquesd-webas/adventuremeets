import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLogin } from "../../hooks/useLogin";
import { useAuth } from "../../context/authContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useGoogleAuthUrl } from "../../hooks/useGoogleAuthUrl";
import { useGoogleCodeLogin } from "../../hooks/useGoogleCodeLogin";
import { AuthSocialButtons } from "./AuthSocialButtons";

function parseGoogleState(stateValue: string | null) {
  const result: { invite: string | null; returnTo: string | null } = {
    invite: null,
    returnTo: null,
  };
  if (!stateValue) return result;
  try {
    const parsed = JSON.parse(stateValue) as {
      invite?: unknown;
      returnTo?: unknown;
    };
    if (typeof parsed.invite === "string") {
      result.invite = parsed.invite;
    }
    if (
      typeof parsed.returnTo === "string" &&
      parsed.returnTo.startsWith("/")
    ) {
      result.returnTo = parsed.returnTo;
    }
    return result;
  } catch {
    return result;
  }
}

type LoginFormProps = {
  onSuccess?: () => void;
  submitLabel?: string;
  showSocialButtons?: boolean;
  showFooterLinks?: boolean;
};

const AuthErrorAlert = ({ message }: { message: string | Error | null }) => {
  if (!message) return null;
  return (
    <Alert severity="error">
      {typeof message === "string" ? message : message.message}
    </Alert>
  );
};

export function LoginForm({
  onSuccess,
  submitLabel = "Login",
  showSocialButtons = false,
  showFooterLinks = false,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleErrorMessage, setGoogleErrorMessage] = useState<string | null>(
    null,
  );
  const { loginAsync, isLoading, error } = useLogin();
  const {
    getGoogleAuthUrlAsync,
    isLoading: isGoogleRedirecting,
    error: googleAuthUrlError,
  } = useGoogleAuthUrl();
  const {
    googleCodeLoginAsync,
    isLoading: isGoogleCodeLoading,
    error: googleCodeLoginError,
  } = useGoogleCodeLogin();
  const { refreshSession } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const handledCodeRef = useRef<string | null>(null);
  const googleRedirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/oauth/callback/google`
      : "";

  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const parsedGoogleState = useMemo(
    () => parseGoogleState(params.get("state")),
    [params],
  );
  const inviteCode = params.get("invite") ?? parsedGoogleState.invite;
  const returnToFromQuery = params.get("returnTo");
  const returnTo = useMemo(() => {
    if (
      typeof returnToFromQuery === "string" &&
      returnToFromQuery.startsWith("/")
    ) {
      return returnToFromQuery;
    }
    return parsedGoogleState.returnTo;
  }, [parsedGoogleState.returnTo, returnToFromQuery]);

  useEffect(() => {
    if (!showSocialButtons) return;
    if (!googleRedirectUri) return;

    const oauthError = params.get("error");
    if (oauthError) {
      setGoogleErrorMessage("Google login was cancelled or failed.");
      return;
    }

    const code = params.get("code");
    if (!code) return;
    if (handledCodeRef.current === code) return;

    handledCodeRef.current = code;
    setGoogleErrorMessage(null);

    googleCodeLoginAsync({ code, redirectUri: googleRedirectUri })
      .then(async () => {
        await refreshSession();
        if (onSuccess) {
          onSuccess();
          return;
        }
        nav(returnTo || "/", { replace: true });
      })
      .catch((err) => {
        handledCodeRef.current = null;
        setGoogleErrorMessage(
          err instanceof Error ? err.message : "Google login failed",
        );
      });
  }, [
    googleCodeLoginAsync,
    googleRedirectUri,
    nav,
    onSuccess,
    params,
    refreshSession,
    returnTo,
    showSocialButtons,
  ]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loginAsync({ email, password })
      .then(() => refreshSession())
      .then(() => {
        if (onSuccess) {
          onSuccess();
          return;
        }
        nav(returnTo || "/");
      })
      .catch((err) => {
        console.error("Login failed", err);
      });
  };

  const handleGoogleLogin = async () => {
    if (!googleRedirectUri) return;
    setGoogleErrorMessage(null);
    try {
      const fallbackReturnTo =
        typeof window !== "undefined"
          ? window.location.pathname.startsWith("/oauth/callback/google")
            ? "/"
            : `${window.location.pathname}${window.location.search}`
          : "/";
      const state = JSON.stringify({
        invite: inviteCode || undefined,
        returnTo: returnTo || fallbackReturnTo,
      });
      const response = await getGoogleAuthUrlAsync({
        redirectUri: googleRedirectUri,
        state,
      });
      window.location.assign(response.url);
    } catch (err) {
      setGoogleErrorMessage(
        err instanceof Error ? err.message : "Unable to start Google login",
      );
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" align="left" mb={2}>
        Login
      </Typography>
      <Stack spacing={2}>
        <AuthErrorAlert
          message={
            error ||
            googleErrorMessage ||
            googleAuthUrlError ||
            googleCodeLoginError
          }
        />
        {showSocialButtons && isGoogleCodeLoading ? (
          <>
            <Typography variant="body2" sx={{ textAlign: "center" }}>
              Signing in with {isGoogleCodeLoading ? "Google" : "Google"}...
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CircularProgress
                size={36}
                thickness={5}
                sx={{ color: "#1976d2" }}
                aria-label="Signing in"
              />
            </Box>
          </>
        ) : (
          <>
            <TextField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <EmailOutlinedIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "text.disabled" }}
                  />
                ),
              }}
            />
            <TextField
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <LockOutlinedIcon
                    fontSize="small"
                    sx={{ mr: 1, color: "text.disabled" }}
                  />
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ textTransform: "uppercase" }}
              disabled={
                isLoading ||
                isGoogleRedirecting ||
                isGoogleCodeLoading ||
                !email.trim() ||
                !password.trim()
              }
            >
              {isLoading ? "Logging in..." : submitLabel}
            </Button>

            {showSocialButtons ? (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  align="center"
                >
                  Or continue with
                </Typography>
                <AuthSocialButtons
                  compact
                  onSelect={(provider) => {
                    if (provider === "google") {
                      void handleGoogleLogin();
                    }
                  }}
                />
              </>
            ) : null}
          </>
        )}
        {showFooterLinks ? (
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
            <Link
              href={
                inviteCode
                  ? `/register?invite=${encodeURIComponent(inviteCode)}`
                  : "/register"
              }
            >
              Create Account
            </Link>
            <Link href="/forgot-password">Forgot password?</Link>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
