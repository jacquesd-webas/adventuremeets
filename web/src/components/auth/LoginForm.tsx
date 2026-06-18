import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
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
import { useFacebookAuthUrl } from "../../hooks/useFacebookAuthUrl";
import { useFacebookCodeLogin } from "../../hooks/useFacebookCodeLogin";
import { AuthSocialButtons } from "./AuthSocialButtons";

function buildAuthHref(
  pathname: string,
  options: { invite?: string | null; organizationId?: string | null },
) {
  const params = new URLSearchParams();
  if (options.invite) {
    params.set("invite", options.invite);
  }
  if (options.organizationId) {
    params.set("org", options.organizationId);
  }
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

function parseOauthState(stateValue: string | null) {
  const result: {
    invite: string | null;
    organizationId: string | null;
    returnTo: string | null;
  } = {
    invite: null,
    organizationId: null,
    returnTo: null,
  };
  if (!stateValue) return result;
  try {
    const parsed = JSON.parse(stateValue) as {
      invite?: unknown;
      org?: unknown;
      organizationId?: unknown;
      returnTo?: unknown;
    };
    if (typeof parsed.invite === "string") {
      result.invite = parsed.invite;
    }
    if (typeof parsed.org === "string") {
      result.organizationId = parsed.org;
    } else if (typeof parsed.organizationId === "string") {
      result.organizationId = parsed.organizationId;
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
  const [socialErrorMessage, setSocialErrorMessage] = useState<string | null>(
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
  const {
    getFacebookAuthUrlAsync,
    isLoading: isFacebookRedirecting,
    error: facebookAuthUrlError,
  } = useFacebookAuthUrl();
  const {
    facebookCodeLoginAsync,
    isLoading: isFacebookCodeLoading,
    error: facebookCodeLoginError,
  } = useFacebookCodeLogin();
  const { refreshSession } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const handledCodeRef = useRef<string | null>(null);
  const googleRedirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/oauth/callback/google`
      : "";
  const facebookRedirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/oauth/callback/facebook`
      : "";

  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const parsedOauthState = useMemo(
    () => parseOauthState(params.get("state")),
    [params],
  );
  const inviteCode = params.get("invite") ?? parsedOauthState.invite;
  const organizationId =
    params.get("org") ?? parsedOauthState.organizationId ?? undefined;
  const returnToFromQuery = params.get("returnTo");
  const returnTo = useMemo(() => {
    if (
      typeof returnToFromQuery === "string" &&
      returnToFromQuery.startsWith("/")
    ) {
      return returnToFromQuery;
    }
    return parsedOauthState.returnTo;
  }, [parsedOauthState.returnTo, returnToFromQuery]);

  const oauthProvider = useMemo(() => {
    if (!showSocialButtons) return null;
    if (location.pathname.startsWith("/oauth/callback/google")) return "google";
    if (location.pathname.startsWith("/oauth/callback/facebook"))
      return "facebook";
    return null;
  }, [location.pathname, showSocialButtons]);

  useEffect(() => {
    if (!showSocialButtons) return;
    if (!oauthProvider) return;

    const oauthError = params.get("error");
    if (oauthError) {
      setSocialErrorMessage(
        `${oauthProvider === "google" ? "Google" : "Facebook"} login was cancelled or failed.`,
      );
      return;
    }

    const code = params.get("code");
    if (!code) return;
    const handledKey = `${oauthProvider}:${code}`;
    if (handledCodeRef.current === handledKey) return;

    handledCodeRef.current = handledKey;
    setSocialErrorMessage(null);

    const doLogin =
      oauthProvider === "google"
        ? googleCodeLoginAsync({
            code,
            redirectUri: googleRedirectUri,
            organizationId,
          })
        : facebookCodeLoginAsync({
            code,
            redirectUri: facebookRedirectUri,
            organizationId,
          });

    doLogin
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
        setSocialErrorMessage(
          err instanceof Error
            ? err.message
            : `${oauthProvider === "facebook" ? "Facebook" : "Google"} login failed`,
        );
      });
  }, [
    facebookCodeLoginAsync,
    facebookRedirectUri,
    googleCodeLoginAsync,
    googleRedirectUri,
    nav,
    onSuccess,
    organizationId,
    oauthProvider,
    params,
    refreshSession,
    returnTo,
    showSocialButtons,
  ]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loginAsync({ email, password, organizationId })
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
    setSocialErrorMessage(null);
    try {
      const fallbackReturnTo =
        typeof window !== "undefined"
          ? window.location.pathname.startsWith("/oauth/callback/google")
            ? "/"
            : `${window.location.pathname}${window.location.search}`
          : "/";
      const state = JSON.stringify({
        invite: inviteCode || undefined,
        org: organizationId,
        returnTo: returnTo || fallbackReturnTo,
      });
      const response = await getGoogleAuthUrlAsync({
        redirectUri: googleRedirectUri,
        state,
      });
      window.location.assign(response.url);
    } catch (err) {
      setSocialErrorMessage(
        err instanceof Error ? err.message : "Unable to start Google login",
      );
    }
  };

  const handleFacebookLogin = async () => {
    if (!facebookRedirectUri) return;
    setSocialErrorMessage(null);
    try {
      const fallbackReturnTo =
        typeof window !== "undefined"
          ? window.location.pathname.startsWith("/oauth/callback/facebook")
            ? "/"
            : `${window.location.pathname}${window.location.search}`
          : "/";
      const state = JSON.stringify({
        invite: inviteCode || undefined,
        org: organizationId,
        returnTo: returnTo || fallbackReturnTo,
      });
      const response = await getFacebookAuthUrlAsync({
        redirectUri: facebookRedirectUri,
        state,
      });
      window.location.assign(response.url);
    } catch (err) {
      setSocialErrorMessage(
        err instanceof Error ? err.message : "Unable to start Facebook login",
      );
    }
  };

  const isSocialLoading = isGoogleCodeLoading || isFacebookCodeLoading;
  const socialProviderLabel =
    oauthProvider === "facebook" ? "Facebook" : "Google";

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" align="left" mb={2}>
        Login
      </Typography>
      <Stack spacing={2}>
        <AuthErrorAlert
          message={
            error ||
            socialErrorMessage ||
            googleAuthUrlError ||
            googleCodeLoginError ||
            facebookAuthUrlError ||
            facebookCodeLoginError
          }
        />
        {showSocialButtons && isSocialLoading ? (
          <>
            <Typography variant="body2" sx={{ textAlign: "center" }}>
              Signing in with {socialProviderLabel}...
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
                  <InputAdornment position="start">
                    <EmailOutlinedIcon
                      fontSize="small"
                      sx={{ color: "text.disabled" }}
                    />
                  </InputAdornment>
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
                  <InputAdornment position="start">
                    <LockOutlinedIcon
                      fontSize="small"
                      sx={{ color: "text.disabled" }}
                    />
                  </InputAdornment>
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
                isFacebookRedirecting ||
                isFacebookCodeLoading ||
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
                    if (provider === "facebook") {
                      void handleFacebookLogin();
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
              href={buildAuthHref("/register", {
                invite: inviteCode,
                organizationId,
              })}
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
