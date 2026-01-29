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
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState, ChangeEvent } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useUpdateUser } from "../hooks/useUpdateUser";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { useUpdateOrganization } from "../hooks/useUpdateOrganization";
import { useAuth } from "../context/authContext";
import {
  buildInternationalPhone,
  getDefaultPhoneCountry,
  InternationalPhoneField,
  splitInternationalPhone,
} from "./InternationalPhoneField";
import { getLocaleDefaults } from "../helpers/locale";
import { useCurrentOrganization } from "../context/organizationContext";
import { useFetchOrganizationMetaDefinitions } from "../hooks/useFetchOrganizationMetaDefinitions";
import { useFetchUserMetaValues } from "../hooks/useFetchUserMetaValues";
import { useUpdateUserMetaValues } from "../hooks/useUpdateUserMetaValues";
import { useNotistack } from "../hooks/useNotistack";

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
import { NameField } from "./NameField";

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const { success } = useNotistack();
  const { currentOrganizationId, currentOrganizationRole } =
    useCurrentOrganization();
  const {
    updateUserAsync,
    isLoading: isUserSaving,
    error: userError,
  } = useUpdateUser();
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

  const [section, setSection] = useState<
    | "personal"
    | "organization"
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
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
    value: string | null
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
        raw
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
    if (organization?.name) {
      setOrgName(organization.name);
    }
  }, [organization?.name]);

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
  };

  const handleSaveEmail = async () => {
    if (!user) return;
    if (!email.trim()) return;
    await updateUserAsync({ id: user.id, email: email.trim() });
    success("Email updated");
  };

  const handleSaveOrg = async () => {
    if (!organization) return;
    await updateOrganizationAsync({ id: organization.id, name: orgName });
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { minHeight: "80vh" } }}
    >
      <DialogTitle>Profile</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={4} md={3}>
            <List component="nav">
              {[
                { key: "personal", label: "Personal details" },
                { key: "organization", label: "Organisation" },
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
                  sx={{ alignSelf: "flex-start" }}
                >
                  Save personal details
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
                    Rename your organisation.
                  </Typography>
                </Box>
                <TextField
                  label="Organisation name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  fullWidth
                  disabled={orgLoading || currentOrganizationRole !== "admin"}
                />
                {orgError && <Alert severity="error">{orgError}</Alert>}
                {orgSaveError && <Alert severity="error">{orgSaveError}</Alert>}
                <TextField
                  label="Invite link"
                  value={inviteLink}
                  fullWidth
                  type={isAdmin ? "text" : "password"}
                  InputProps={{
                    readOnly: true,
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
                <Button
                  variant="outlined"
                  onClick={copyInvite}
                  disabled={!inviteLink || !isAdmin}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {inviteCopied ? "Copied!" : "Copy invite link"}
                </Button>
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
                  sx={{ alignSelf: "flex-start" }}
                >
                  Save organization
                </Button>
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
                    >
                      Change Email
                    </Button>
                    {user?.emailVerified ? (
                      <Alert severity="success">Verified</Alert>
                    ) : (
                      <Button variant="outlined" disabled>
                        Verify Email
                      </Button>
                    )}
                  </Stack>
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
                        Boolean(confirmPassword) &&
                        newPassword !== confirmPassword
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
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Update password
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
                            type={
                              item.fieldType === "number" ? "number" : "text"
                            }
                            value={
                              typeof value === "number" ||
                              typeof value === "string"
                                ? value
                                : ""
                            }
                            onChange={(e) =>
                              setAutoFillValue(
                                key,
                                item.fieldType === "number" &&
                                  e.target.value !== ""
                                  ? Number(e.target.value)
                                  : e.target.value
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
                  sx={{ alignSelf: "flex-start" }}
                  disabled={
                    metaLoading ||
                    userMetaLoading ||
                    Boolean(metaError || userMetaError)
                  }
                  onClick={async () => {
                    if (!user || !currentOrganizationId) return;
                    const values = metaDefinitions.map((definition) => {
                      const raw = autoFillValues[definition.fieldKey];
                      let value: string | null;
                      if (raw === "" || raw === undefined || raw === null) {
                        value = null;
                      } else if (typeof raw === "boolean") {
                        value = raw ? "true" : "false";
                      } else {
                        value = String(raw);
                      }
                      return { key: definition.fieldKey, value };
                    });
                    await updateMetaValuesAsync({
                      userId: user.id,
                      organizationId: currentOrganizationId,
                      values,
                    });
                  }}
                >
                  {userMetaSaving ? "Saving..." : "Save AutoFill"}
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
                    Emergency contact and medical information will only be
                    available to the meet organiser and only on the day of the
                    meet. It is recommended that you carry your medical
                    information on your person, in case you are unresponsive and
                    the meet organiser is not able to access your information
                    for first responders.
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
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
