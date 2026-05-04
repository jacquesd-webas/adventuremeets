import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useUpdateUser } from "../../hooks/useUpdateUser";
import { useRequestEmailVerification } from "../../hooks/useRequestEmailVerification";
import { useConfirmEmailVerification } from "../../hooks/useConfirmEmailVerification";
import { useAuth } from "../../context/authContext";
import { useNotistack } from "../../hooks/useNotistack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const actionButtonSx = { alignSelf: "center", minWidth: 180 };

export function ProfileSecurity() {
  const { user, refreshSession } = useAuth();
  const { success } = useNotistack();
  const { updateUserAsync, isLoading: isUserSaving } = useUpdateUser();
  const {
    requestVerificationAsync,
    isLoading: isVerificationSending,
    error: verificationError,
  } = useRequestEmailVerification();
  const {
    confirmVerificationAsync,
    isLoading: isVerificationConfirming,
    error: confirmError,
  } = useConfirmEmailVerification();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);

  useEffect(() => {
    setEmail(user?.email ?? "");
  }, [user]);

  const handleSaveEmail = async () => {
    if (!user || !email.trim()) return;
    await updateUserAsync({ id: user.id, email: email.trim() });
    success("Email updated");
    setEmailSaved(true);
    window.setTimeout(() => setEmailSaved(false), 1500);
  };

  const handleSavePassword = async () => {
    if (
      !user ||
      !newPassword ||
      (!showPassword && newPassword !== confirmPassword)
    ) {
      return;
    }
    await updateUserAsync({ id: user.id, password: newPassword });
    setNewPassword("");
    setConfirmPassword("");
    success("Password updated");
    setPasswordSaved(true);
    window.setTimeout(() => setPasswordSaved(false), 1500);
  };

  const handleRequestVerification = async () => {
    if (!user) return;
    await requestVerificationAsync();
    success("Verification email sent");
    setVerificationSent(true);
    window.setTimeout(() => setVerificationSent(false), 1500);
  };

  const handleConfirmVerification = async () => {
    if (!user) return;
    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) return;
    await confirmVerificationAsync({ code });
    await refreshSession();
    success("Email verified");
    setVerificationCode("");
    setVerificationConfirmed(true);
    window.setTimeout(() => setVerificationConfirmed(false), 1500);
  };

  const formatVerificationError = (message: string) => {
    if (message.includes("Invalid verification code")) {
      return "That code is incorrect. Please try again.";
    }
    if (message.includes("Verification code expired")) {
      return "That code has expired. Please request a new one.";
    }
    if (message.includes("Verification code not found")) {
      return "Please request a verification code first.";
    }
    if (message.includes("Verification temporarily locked")) {
      return "Too many attempts. Please request a new code and try again.";
    }
    return message;
  };

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Security</Typography>
        <Typography variant="body2" color="text.secondary">
          Update your email and password.
        </Typography>
      </Box>
      <Stack spacing={2} sx={{ width: "100%" }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Change your e-mail address
        </Typography>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            onClick={() => void handleSaveEmail()}
            disabled={isUserSaving || !email.trim() || email === user?.email}
            sx={{ minWidth: 180 }}
            startIcon={
              emailSaved ? <CheckCircleIcon fontSize="small" /> : undefined
            }
          >
            {emailSaved ? "Saved" : "Change Email"}
          </Button>
          {user?.emailVerified ? (
            <Alert
              severity="success"
              sx={{ py: 0.2, px: 1.5, alignItems: "center" }}
            >
              Verified
            </Alert>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={() => void handleRequestVerification()}
              disabled={isVerificationSending}
              startIcon={
                verificationSent ? (
                  <CheckCircleIcon fontSize="small" />
                ) : undefined
              }
              sx={{
                minHeight: 36,
                height: 36,
                px: 1.5,
                py: 0,
                lineHeight: "36px",
                alignItems: "center",
                "& .MuiButton-startIcon": { alignSelf: "center" },
              }}
            >
              {verificationSent ? "Sent" : "Verify Email"}
            </Button>
          )}
        </Stack>
        {!user?.emailVerified ? (
          <Stack spacing={0.5}>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              alignItems="center"
              sx={{
                "@media (max-width: 750px)": {
                  flexDirection: "column",
                  alignItems: "stretch",
                },
              }}
            >
              <TextField
                label="Verification code"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/[^\d]/g, "").slice(0, 6),
                  )
                }
                inputProps={{ inputMode: "numeric" }}
                sx={{
                  width: 280,
                  "@media (max-width: 750px)": { width: "100%" },
                }}
              />
              <Button
                variant="contained"
                onClick={() => void handleConfirmVerification()}
                disabled={
                  isVerificationConfirming ||
                  !/^\d{6}$/.test(verificationCode.trim())
                }
                startIcon={
                  verificationConfirmed ? (
                    <CheckCircleIcon fontSize="small" />
                  ) : undefined
                }
                sx={{
                  minWidth: 180,
                  alignSelf: "center",
                  "@media (max-width: 750px)": {
                    minWidth: "100%",
                    alignSelf: "stretch",
                    width: "100%",
                  },
                }}
              >
                {verificationConfirmed ? "Verified" : "Confirm code"}
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Enter the 6 digit code from your email.
            </Typography>
          </Stack>
        ) : null}
        {verificationError ? (
          <Alert severity="error">
            {formatVerificationError(verificationError)}
          </Alert>
        ) : null}
        {confirmError ? (
          <Alert severity="error">
            {formatVerificationError(confirmError)}
          </Alert>
        ) : null}
      </Stack>
      <Divider sx={{ width: "100%" }} />
      <Stack spacing={2} sx={{ width: "100%" }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Change password
        </Typography>
        <TextField
          label="New password"
          type={showPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  size="small"
                >
                  {showPassword ? (
                    <VisibilityOffIcon fontSize="small" />
                  ) : (
                    <VisibilityIcon fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {!showPassword ? (
          <TextField
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            error={Boolean(confirmPassword) && newPassword !== confirmPassword}
            helperText={
              confirmPassword && newPassword !== confirmPassword
                ? "Passwords do not match"
                : ""
            }
          />
        ) : null}
        <Button
          variant="contained"
          onClick={() => void handleSavePassword()}
          disabled={
            !newPassword ||
            (!showPassword && newPassword !== confirmPassword) ||
            isUserSaving
          }
          sx={actionButtonSx}
          startIcon={
            passwordSaved ? <CheckCircleIcon fontSize="small" /> : undefined
          }
        >
          {passwordSaved ? "Saved" : "Update password"}
        </Button>
      </Stack>
    </Stack>
  );
}
