import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState, ChangeEvent } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { useUpdateUser } from "../../hooks/useUpdateUser";
import { useRequestEmailVerification } from "../../hooks/useRequestEmailVerification";
import { useConfirmEmailVerification } from "../../hooks/useConfirmEmailVerification";
import { useFetchOrganization } from "../../hooks/useFetchOrganization";
import { useUpdateOrganization } from "../../hooks/useUpdateOrganization";
import { useAuth } from "../../context/authContext";
import {
  buildInternationalPhone,
  getDefaultPhoneCountry,
  InternationalPhoneField,
  splitInternationalPhone,
} from "../formFields/InternationalPhoneField";
import { getLocaleDefaults } from "../../helpers/locale";
import { useCurrentOrganization } from "../../context/organizationContext";
import { useFetchOrganizationMetaDefinitions } from "../../hooks/useFetchOrganizationMetaDefinitions";
import { useFetchUserMetaValues } from "../../hooks/useFetchUserMetaValues";
import { useUpdateUserMetaValues } from "../../hooks/useUpdateUserMetaValues";
import { useNotistack } from "../../hooks/useNotistack";
import { NameField } from "../formFields/NameField";
import { ORGANIZATION_THEMES } from "../../constants/themes";
import { useCreateOrganizationInvite } from "../../hooks/useCreateOrganizationInvite";
import { useOrganizationRoleOptions } from "../../hooks/useOrganizationRoleOptions";
import { useFetchOrganizationInvites } from "../../hooks/useFetchOrganizationInvites";
import { RoleChip } from "../admin/RoleChip";

function LabeledField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" fontWeight={700}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </Typography>
      {children}
    </Stack>
  );
}

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

type ProfileContentProps = {
  open: boolean;
};

export function ProfileContent({ open }: ProfileContentProps) {
  const actionButtonSx = { alignSelf: "center", minWidth: 180 };
  const { user, refreshSession } = useAuth();
  const { success } = useNotistack();
  const { currentOrganizationId, currentOrganizationRole } =
    useCurrentOrganization();
  const {
    updateUserAsync,
    isLoading: isUserSaving,
    error: userError,
  } = useUpdateUser();
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
  const {
    data: organization,
    isLoading: orgLoading,
    error: orgError,
  } = useFetchOrganization(currentOrganizationId);
  const {
    updateOrganizationAsync,
    isLoading: orgSaving,
    error: orgSaveError,
  } = useUpdateOrganization(currentOrganizationId);
  const {
    createInviteAsync,
    isLoading: isInviteSaving,
    error: inviteError,
  } = useCreateOrganizationInvite();
  const {
    data: invites,
    isLoading: invitesLoading,
    error: invitesError,
  } = useFetchOrganizationInvites(currentOrganizationId || undefined);
  const { roleOptions, defaultRoleId } = useOrganizationRoleOptions();

  const [section, setSection] = useState<
    | "personal"
    | "organization"
    | "invites"
    | "security"
    | "autofill"
    | "emergency"
    | "avatar"
  >("personal");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(() => {
    const localeCountry = getLocaleDefaults().countryCode;
    return getDefaultPhoneCountry(localeCountry);
  });
  const [phoneLocal, setPhoneLocal] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgTheme, setOrgTheme] = useState("");
  const [isOrgPrivate, setIsOrgPrivate] = useState(true);
  const [canViewAllMeets, setCanViewAllMeets] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [directInviteCopied, setDirectInviteCopied] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState(defaultRoleId);
  const [directInviteLink, setDirectInviteLink] = useState("");
  const [personalSaved, setPersonalSaved] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [autoFillSaved, setAutoFillSaved] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);
  const [autoFillValues, setAutoFillValues] = useState<Record<string, any>>({});
  const autoFillLoadedRef = useRef(false);
  const {
    data: metaDefinitions,
    isLoading: metaLoading,
    error: metaError,
  } = useFetchOrganizationMetaDefinitions(currentOrganizationId || undefined);
  const {
    data: userMetaValues,
    isLoading: userMetaLoading,
    error: userMetaError,
  } = useFetchUserMetaValues(user?.id, currentOrganizationId || undefined);
  const {
    updateMetaValuesAsync,
    isLoading: userMetaSaving,
    error: userMetaSaveError,
  } = useUpdateUserMetaValues();
  const setAutoFillValue = (key: string, value: string | number | boolean) => {
    setAutoFillValues((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!open) return;
    autoFillLoadedRef.current = false;
    setAutoFillValues({});
  }, [open, currentOrganizationId, user?.id]);

  const parseMetaValue = (
    fieldType: string,
    value: string | null,
  ): string | number | boolean => {
    if (value === null || value === undefined) {
      return fieldType === "checkbox" || fieldType === "switch" ? false : "";
    }
    if (fieldType === "number") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? "" : parsed;
    }
    if (fieldType === "checkbox" || fieldType === "switch") {
      return value === "true";
    }
    return value;
  };

  useEffect(() => {
    if (!open) return;
    if (autoFillLoadedRef.current) return;
    if (!metaDefinitions.length || userMetaLoading) return;
    const byKey = new Map(userMetaValues.map((item) => [item.key, item.value]));
    const initialValues: Record<string, any> = {};
    metaDefinitions.forEach((definition) => {
      const raw = byKey.get(definition.fieldKey) ?? null;
      initialValues[definition.fieldKey] = parseMetaValue(
        definition.fieldType,
        raw,
      );
    });
    setAutoFillValues(initialValues);
    autoFillLoadedRef.current = true;
  }, [open, metaDefinitions, userMetaLoading, userMetaValues]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setEmail(user.email ?? "");
      if (user.phone) {
        const parsed = splitInternationalPhone(user.phone);
        setPhoneCountry(parsed.country);
        setPhoneLocal(parsed.local);
      } else {
        const localeCountry = getLocaleDefaults().countryCode;
        setPhoneCountry(getDefaultPhoneCountry(localeCountry));
        setPhoneLocal("");
      }
    }
  }, [user]);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setOrgTheme(organization.theme ?? "");
      setIsOrgPrivate(Boolean(organization.isPrivate));
      setCanViewAllMeets(organization.canViewAllMeets ?? true);
    }
  }, [organization]);

  const initials = useMemo(() => {
    const name = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (!name) return user?.email?.slice(0, 2)?.toUpperCase() || "AM";
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [firstName, lastName, user?.email]);

  const handleSavePersonal = async () => {
    if (!user) return;
    const phone = buildInternationalPhone(phoneCountry, phoneLocal);
    await updateUserAsync({
      id: user.id,
      firstName,
      lastName,
      phone,
    });
    success("Personal details updated");
    setPersonalSaved(true);
    window.setTimeout(() => setPersonalSaved(false), 1500);
  };

  const handleSaveEmail = async () => {
    if (!user) return;
    if (!email.trim()) return;
    await updateUserAsync({ id: user.id, email: email.trim() });
    success("Email updated");
    setEmailSaved(true);
    window.setTimeout(() => setEmailSaved(false), 1500);
  };

  const handleSaveOrg = async () => {
    if (!organization) return;
    await updateOrganizationAsync({
      id: organization.id,
      name: orgName,
      theme: orgTheme || undefined,
      isPrivate: isOrgPrivate,
      canViewAllMeets,
    });
    setOrgSaved(true);
    window.setTimeout(() => setOrgSaved(false), 1500);
  };

  const handleSaveTheme = async () => {
    if (!organization) return;
    await updateOrganizationAsync({
      id: organization.id,
      name: orgName,
      theme: orgTheme || undefined,
      isPrivate: isOrgPrivate,
      canViewAllMeets,
    });
    setThemeSaved(true);
    window.setTimeout(() => setThemeSaved(false), 1500);
  };

  const handleSavePassword = async () => {
    if (
      !user ||
      !newPassword ||
      (!showPassword && newPassword !== confirmPassword)
    )
      return;
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

  const handleSaveAutoFill = async () => {
    if (!user || !currentOrganizationId) return;
    const fieldKeys = new Set<string>([
      ...metaDefinitions.map((definition) => definition.fieldKey),
      ...userMetaValues.map((item) => item.key),
    ]);
    const definitionByKey = new Map(
      metaDefinitions.map((definition) => [definition.fieldKey, definition]),
    );
    const values = Array.from(fieldKeys).map((key) => {
      const raw = autoFillValues[key];
      const fieldType = definitionByKey.get(key)?.fieldType;
      let value: string | null;
      if (raw === "" || raw === undefined || raw === null) {
        value = null;
      } else if (
        typeof raw === "boolean" ||
        fieldType === "checkbox" ||
        fieldType === "switch"
      ) {
        value = raw ? "true" : "false";
      } else {
        value = String(raw);
      }
      return { key, value };
    });
    await updateMetaValuesAsync({
      userId: user.id,
      organizationId: currentOrganizationId,
      values,
    });
    setAutoFillSaved(true);
    window.setTimeout(() => setAutoFillSaved(false), 1500);
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    // TODO: wire to backend avatar upload endpoint when available.
  };

  const inviteLink = currentOrganizationId
    ? `${window.location.origin}/register?org=${currentOrganizationId}`
    : "";
  const isAdmin = currentOrganizationRole === "admin";

  const copyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 1500);
  };

  const toInviteRegisterUrl = (tokenOrUrl?: string) => {
    if (!tokenOrUrl) return "";
    if (/^https?:\/\//i.test(tokenOrUrl)) {
      return tokenOrUrl;
    }
    return `${window.location.origin}/register?invite=${encodeURIComponent(
      tokenOrUrl,
    )}`;
  };

  const handleInviteUser = async () => {
    const trimmedEmail = inviteEmailInput.trim();
    if (!currentOrganizationId || !trimmedEmail) return;

    const invite = await createInviteAsync({
      organizationId: currentOrganizationId,
      email: trimmedEmail,
      roleId: inviteRoleId,
    });
    setDirectInviteLink(toInviteRegisterUrl(invite.inviteUrl || invite.token));
    setDirectInviteCopied(false);
    setInviteEmailInput("");
    success("Invite created");
  };

  const copyDirectInvite = async () => {
    if (!directInviteLink) return;
    await navigator.clipboard.writeText(directInviteLink);
    setDirectInviteCopied(true);
    setTimeout(() => setDirectInviteCopied(false), 1500);
  };

  const copyPendingInviteLink = async (invite: {
    id: string;
    token: string;
    inviteUrl?: string;
  }) => {
    const registerUrl = toInviteRegisterUrl(invite.inviteUrl || invite.token);
    if (!registerUrl) return;
    await navigator.clipboard.writeText(registerUrl);
    setCopiedInviteId(invite.id);
    setTimeout(() => {
      setCopiedInviteId((current) => (current === invite.id ? null : current));
    }, 1500);
  };

  return (
    <Grid container spacing={2} sx={{ mt: 0 }}>
      <Grid item xs={12} sm={4} md={3}>
        <List component="nav">
          {[
            { key: "personal", label: "Personal details" },
            { key: "organization", label: "Organisation" },
            { key: "invites", label: "Invites" },
            { key: "security", label: "Security" },
            { key: "autofill", label: "AutoFill" },
            { key: "emergency", label: "Emergency Info" },
            { key: "avatar", label: "Avatar" },
          ].map((item) => (
            <ListItemButton
              key={item.key}
              selected={section === item.key}
              onClick={() => setSection(item.key as any)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Grid>
      <Grid item xs={12} sm={8} md={9}>
        {section === "personal" && (
          <Stack
            spacing={2}
            sx={{ minHeight: 320, display: "flex" }}
            alignItems="flex-start"
          >
            <Box>
              <Typography variant="h6">Personal details</Typography>
              <Typography variant="body2" color="text.secondary">
                Update your personal details.
              </Typography>
            </Box>
            <NameField
              label="First name"
              value={firstName}
              onChange={(value) => setFirstName(value)}
              fullWidth
            />
            <NameField
              label="Last name"
              value={lastName}
              onChange={(value) => setLastName(value)}
              fullWidth
            />
            <InternationalPhoneField
              country={phoneCountry}
              local={phoneLocal}
              onCountryChange={(value) => setPhoneCountry(value)}
              onLocalChange={(value) => setPhoneLocal(value)}
            />
            {userError && <Alert severity="error">{userError}</Alert>}
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              onClick={handleSavePersonal}
              disabled={isUserSaving}
              sx={actionButtonSx}
              startIcon={
                personalSaved ? <CheckCircleIcon fontSize="small" /> : undefined
              }
            >
              {personalSaved ? "Saved" : "Save personal details"}
            </Button>
          </Stack>
        )}

        {section === "organization" && (
          <Stack
            spacing={2}
            sx={{ minHeight: 320, display: "flex" }}
            alignItems="flex-start"
          >
            <Box>
              <Typography variant="h6">Organisation</Typography>
              <Typography variant="body2" color="text.secondary">
                Rename your organisation and adjust its theme.
              </Typography>
            </Box>
            <TextField
              label="Organisation name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              fullWidth
              disabled={orgLoading || currentOrganizationRole !== "admin"}
            />
            <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
              <TextField
                select
                size="small"
                label="Theme"
                value={orgTheme}
                onChange={(e) => setOrgTheme(e.target.value)}
                fullWidth
                disabled={orgLoading || currentOrganizationRole !== "admin"}
                helperText="Choose an organisation theme."
              >
                <MenuItem value="">Default</MenuItem>
                {ORGANIZATION_THEMES.map((theme) => (
                  <MenuItem key={theme.name} value={theme.name}>
                    {theme.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveTheme}
                disabled={
                  orgLoading ||
                  orgSaving ||
                  !organization ||
                  currentOrganizationRole !== "admin"
                }
                sx={{ minWidth: 120, alignSelf: "flex-start" }}
                startIcon={
                  themeSaved ? <CheckCircleIcon fontSize="small" /> : undefined
                }
              >
                {themeSaved ? "Saved" : "Change"}
              </Button>
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={!isOrgPrivate}
                  onChange={(event) => setIsOrgPrivate(!event.target.checked)}
                  disabled={orgLoading || currentOrganizationRole !== "admin"}
                />
              }
              label="Allow regular users to join with invite link"
            />
            {!isOrgPrivate && (
              <TextField
                label="Invite link"
                value={inviteLink}
                size="small"
                fullWidth
                type={isAdmin ? "text" : "password"}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        title={inviteCopied ? "Copied" : "Copy invite link"}
                      >
                        <span>
                          <IconButton
                            onClick={copyInvite}
                            disabled={!inviteLink || !isAdmin}
                            size="small"
                            edge="end"
                            aria-label="Copy invite link"
                          >
                            {inviteCopied ? (
                              <AssignmentTurnedInIcon fontSize="small" />
                            ) : (
                              <ContentCopyIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  onCopy: (event: React.ClipboardEvent<HTMLInputElement>) => {
                    if (!isAdmin) {
                      event.preventDefault();
                    }
                  },
                }}
                helperText="Share this link to invite members to your organisation."
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={canViewAllMeets}
                  onChange={(event) => setCanViewAllMeets(event.target.checked)}
                  disabled={orgLoading || currentOrganizationRole !== "admin"}
                />
              }
              label="Allow members to see all events in this organisation"
            />
            {orgError && <Alert severity="error">{orgError}</Alert>}
            {orgSaveError && <Alert severity="error">{orgSaveError}</Alert>}
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              onClick={handleSaveOrg}
              disabled={
                orgLoading ||
                orgSaving ||
                !organization ||
                currentOrganizationRole !== "admin"
              }
              sx={actionButtonSx}
              startIcon={
                orgSaved ? <CheckCircleIcon fontSize="small" /> : undefined
              }
            >
              {orgSaved ? "Saved" : "Save organization"}
            </Button>
          </Stack>
        )}

        {section === "invites" && (
          <Stack
            spacing={2}
            sx={{ minHeight: 320, display: "flex" }}
            alignItems="flex-start"
          >
            <Box>
              <Typography variant="h6">Invites</Typography>
              <Typography variant="body2" color="text.secondary">
                Invite users to join your organisation.
              </Typography>
            </Box>
            <Stack spacing={1.5} sx={{ width: "100%" }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ width: "100%" }}
              >
                <TextField
                  label="Email"
                  type="email"
                  value={inviteEmailInput}
                  size="small"
                  onChange={(event) => setInviteEmailInput(event.target.value)}
                  fullWidth
                  disabled={!isAdmin}
                />
                <TextField
                  select
                  label="Role"
                  value={String(inviteRoleId)}
                  size="small"
                  onChange={(event) =>
                    setInviteRoleId(Number(event.target.value))
                  }
                  sx={{ minWidth: 180 }}
                  disabled={!isAdmin}
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.id} value={String(option.id)}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  onClick={handleInviteUser}
                  disabled={
                    !isAdmin ||
                    !currentOrganizationId ||
                    !inviteEmailInput.trim() ||
                    isInviteSaving
                  }
                  sx={{ minWidth: 140, alignSelf: "stretch" }}
                >
                  {isInviteSaving ? "Sending..." : "Invite User"}
                </Button>
              </Stack>
              {directInviteLink ? (
                <TextField
                  label="Generated invite link"
                  value={directInviteLink}
                  size="small"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip
                          title={
                            directInviteCopied
                              ? "Copied"
                              : "Copy generated invite link"
                          }
                        >
                          <span>
                            <IconButton
                              onClick={copyDirectInvite}
                              disabled={!directInviteLink}
                              size="small"
                              edge="end"
                              aria-label="Copy generated invite link"
                            >
                              {directInviteCopied ? (
                                <AssignmentTurnedInIcon fontSize="small" />
                              ) : (
                                <ContentCopyIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              ) : null}
            </Stack>
            <Divider sx={{ width: "100%" }} />
            <Stack spacing={1.5} sx={{ width: "100%" }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Invites
              </Typography>
              {invitesLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              ) : invitesError ? (
                <Alert severity="error">{invitesError}</Alert>
              ) : invites.length ? (
                <Stack spacing={1} sx={{ width: "100%" }}>
                  <Box
                    sx={{
                      width: "100%",
                      overflowX: "auto",
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: 500,
                        display: "grid",
                        gridTemplateColumns:
                          "32px minmax(220px, 2fr) 140px 64px",
                        columnGap: 1.5,
                        px: 1.5,
                        pb: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textAlign: "center" }}
                      >
                        Role
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textAlign: "center", justifySelf: "center" }}
                      >
                        Link
                      </Typography>
                    </Box>
                    <Stack spacing={1}>
                      {invites.map((invite) => (
                        <Box
                          key={invite.id}
                          sx={{
                            width: "100%",
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                            px: 1.5,
                            py: 1,
                            minWidth: 500,
                            display: "grid",
                            gridTemplateColumns:
                              "32px minmax(220px, 2fr) 140px 64px",
                            columnGap: 1.5,
                            alignItems: "center",
                          }}
                        >
                          <Tooltip
                            title={
                              invite.status === "accepted"
                                ? "Accepted"
                                : invite.status === "declined"
                                  ? "Declined"
                                  : "Pending"
                            }
                          >
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {invite.status === "accepted" ? (
                                <CheckCircleIcon
                                  fontSize="small"
                                  color="success"
                                />
                              ) : invite.status === "declined" ? (
                                <CloseIcon fontSize="small" color="error" />
                              ) : (
                                <HourglassEmptyIcon
                                  fontSize="small"
                                  color="disabled"
                                />
                              )}
                            </Box>
                          </Tooltip>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {invite.email}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <RoleChip roleId={invite.roleId} />
                          </Box>
                          <Box
                            sx={{ display: "flex", justifyContent: "center" }}
                          >
                            <Tooltip
                              title={
                                copiedInviteId === invite.id
                                  ? "Copied"
                                  : "Copy invite link"
                              }
                            >
                              <span>
                                <IconButton
                                  onClick={() =>
                                    void copyPendingInviteLink(invite)
                                  }
                                  disabled={!invite.token && !invite.inviteUrl}
                                  size="small"
                                  aria-label={`Copy invite link for ${invite.email}`}
                                >
                                  {copiedInviteId === invite.id ? (
                                    <AssignmentTurnedInIcon fontSize="small" />
                                  ) : (
                                    <ContentCopyIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No valid invites.
                </Typography>
              )}
            </Stack>
            {orgError && <Alert severity="error">{orgError}</Alert>}
            {orgSaveError && <Alert severity="error">{orgSaveError}</Alert>}
            {inviteError ? <Alert severity="error">{inviteError}</Alert> : null}
          </Stack>
        )}

        {section === "security" && (
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
                  onClick={handleSaveEmail}
                  disabled={
                    isUserSaving || !email.trim() || email === user?.email
                  }
                  sx={{ minWidth: 180 }}
                  startIcon={
                    emailSaved ? (
                      <CheckCircleIcon fontSize="small" />
                    ) : undefined
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
                    onClick={handleRequestVerification}
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
              {!user?.emailVerified && (
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
                      onClick={handleConfirmVerification}
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
              )}
              {verificationError && (
                <Alert severity="error">
                  {formatVerificationError(verificationError)}
                </Alert>
              )}
              {confirmError && (
                <Alert severity="error">
                  {formatVerificationError(confirmError)}
                </Alert>
              )}
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
              {!showPassword && (
                <TextField
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  error={
                    Boolean(confirmPassword) && newPassword !== confirmPassword
                  }
                  helperText={
                    confirmPassword && newPassword !== confirmPassword
                      ? "Passwords do not match"
                      : ""
                  }
                />
              )}
              <Button
                variant="contained"
                onClick={handleSavePassword}
                disabled={
                  !newPassword ||
                  (!showPassword && newPassword !== confirmPassword) ||
                  isUserSaving
                }
                sx={actionButtonSx}
                startIcon={
                  passwordSaved ? (
                    <CheckCircleIcon fontSize="small" />
                  ) : undefined
                }
              >
                {passwordSaved ? "Saved" : "Update password"}
              </Button>
            </Stack>
          </Stack>
        )}

        {section === "autofill" && (
          <Stack
            spacing={2}
            sx={{ minHeight: 320, display: "flex" }}
            alignItems="flex-start"
          >
            <Box>
              <Typography variant="h6">AutoFill</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage default details used for meet applications.
              </Typography>
            </Box>
            {metaLoading || userMetaLoading ? (
              <Typography variant="body2" color="text.secondary">
                Loading organization questions...
              </Typography>
            ) : metaError || userMetaError ? (
              <Alert severity="error">{metaError || userMetaError}</Alert>
            ) : metaDefinitions.length ? (
              <Stack spacing={2} sx={{ width: "100%" }}>
                {metaDefinitions.map((item) => {
                  const key = item.fieldKey;
                  const value = autoFillValues[key];
                  if (
                    item.fieldType === "checkbox" ||
                    item.fieldType === "switch"
                  ) {
                    return (
                      <FormControlLabel
                        key={key}
                        control={
                          <Switch
                            checked={Boolean(value)}
                            onChange={(e) =>
                              setAutoFillValue(key, e.target.checked)
                            }
                          />
                        }
                        label={`${item.label}${item.required ? " *" : ""}`}
                      />
                    );
                  }
                  if (item.fieldType === "select") {
                    const options = Array.isArray(item.config?.options)
                      ? item.config?.options
                      : [];
                    return (
                      <LabeledField
                        key={key}
                        label={item.label}
                        required={item.required}
                      >
                        <TextField
                          select
                          value={typeof value === "string" ? value : ""}
                          onChange={(e) =>
                            setAutoFillValue(key, e.target.value)
                          }
                          fullWidth
                        >
                          <MenuItem value="">Select an option</MenuItem>
                          {options.map((option: string) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>
                      </LabeledField>
                    );
                  }
                  return (
                    <LabeledField
                      key={key}
                      label={item.label}
                      required={item.required}
                    >
                      <TextField
                        type={item.fieldType === "number" ? "number" : "text"}
                        value={
                          typeof value === "number" || typeof value === "string"
                            ? value
                            : ""
                        }
                        onChange={(e) =>
                          setAutoFillValue(
                            key,
                            item.fieldType === "number" && e.target.value !== ""
                              ? Number(e.target.value)
                              : e.target.value,
                          )
                        }
                        fullWidth
                      />
                    </LabeledField>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No organization questions found.
              </Typography>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              sx={actionButtonSx}
              disabled={
                metaLoading ||
                userMetaLoading ||
                Boolean(metaError || userMetaError)
              }
              onClick={handleSaveAutoFill}
              startIcon={
                autoFillSaved ? <CheckCircleIcon fontSize="small" /> : undefined
              }
            >
              {userMetaSaving
                ? "Saving..."
                : autoFillSaved
                  ? "Saved"
                  : "Save AutoFill"}
            </Button>
            {userMetaSaveError ? (
              <Alert severity="error">{userMetaSaveError}</Alert>
            ) : null}
          </Stack>
        )}

        {section === "emergency" && (
          <Stack
            spacing={2}
            sx={{ minHeight: 320, display: "flex" }}
            alignItems="flex-start"
          >
            <Box>
              <Typography variant="h6">Emergency Info</Typography>
              <Typography variant="body2" color="text.secondary">
                Emergency contact and medical information will only be available
                to the meet organiser and only on the day of the meet. It is
                recommended that you carry your medical information on your
                person, in case you are unresponsive and the meet organiser is
                not able to access your information for first responders.
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Emergency info settings will be available soon.
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
          </Stack>
        )}

        {section === "avatar" && (
          <Stack
            spacing={2}
            sx={{ minHeight: 320, display: "flex" }}
            alignItems="flex-start"
          >
            <Box>
              <Typography variant="h6">Avatar</Typography>
              <Typography variant="body2" color="text.secondary">
                Upload a profile picture.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={avatarPreview || undefined}
                sx={{ width: 64, height: 64 }}
              >
                {initials}
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Upload an image to use as your avatar. (Coming soon!)
                </Typography>
                <Button variant="outlined" component="label">
                  Choose file
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </Button>
              </Box>
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
          </Stack>
        )}
      </Grid>
    </Grid>
  );
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      data-testid="profile-modal"
      PaperProps={{ sx: { minHeight: "80vh" } }}
    >
      <DialogTitle>Profile</DialogTitle>
      <DialogContent dividers>
        <ProfileContent open={open} />
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={onClose} data-testid="close-profile-modal">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
