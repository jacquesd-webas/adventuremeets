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
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { useUpdateUser } from "../hooks/useUpdateUser";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { useUpdateOrganization } from "../hooks/useUpdateOrganization";
import { useAuth } from "../context/AuthContext";

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const {
    updateUserAsync,
    isLoading: isUserSaving,
    error: userError,
  } = useUpdateUser();
  const primaryOrgId = user?.organizations
    ? Object.keys(user.organizations)[0]
    : undefined;
  const {
    data: organization,
    isLoading: orgLoading,
    error: orgError,
  } = useFetchOrganization(primaryOrgId);
  const {
    updateOrganizationAsync,
    isLoading: orgSaving,
    error: orgSaveError,
  } = useUpdateOrganization();

  const [section, setSection] = useState<
    "personal" | "organization" | "security" | "email" | "avatar"
  >("personal");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhone(user.phone ?? "");
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
    await updateUserAsync({
      id: user.id,
      firstName,
      lastName,
      phone,
    });
  };

  const handleSaveOrg = async () => {
    if (!organization) return;
    await updateOrganizationAsync({ id: organization.id, name: orgName });
  };

  const handleSavePassword = async () => {
    if (!user || !newPassword || newPassword !== confirmPassword) return;
    await updateUserAsync({ id: user.id, password: newPassword });
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    // TODO: wire to backend avatar upload endpoint when available.
  };

  const inviteLink = primaryOrgId
    ? `${window.location.origin}/register?org=${primaryOrgId}`
    : "";

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
                { key: "email", label: "Email verification" },
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
                    Update your name and phone number.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={avatarPreview || undefined}>{initials}</Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {[firstName, lastName].filter(Boolean).join(" ") ||
                        "Unnamed"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                </Stack>
                <TextField
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  fullWidth
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
                    Rename your private organisation.
                  </Typography>
                </Box>
                <TextField
                  label="Organisation name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  fullWidth
                  disabled={orgLoading}
                />
                {orgError && <Alert severity="error">{orgError}</Alert>}
                {orgSaveError && <Alert severity="error">{orgSaveError}</Alert>}
                <TextField
                  label="Invite link"
                  value={inviteLink}
                  fullWidth
                  disabled
                  helperText="Share this link to invite members to your organisation."
                />
                <Button
                  variant="outlined"
                  onClick={copyInvite}
                  disabled={!inviteLink}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {inviteCopied ? "Copied!" : "Copy invite link"}
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  variant="contained"
                  onClick={handleSaveOrg}
                  disabled={orgLoading || orgSaving || !organization}
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
                    Change your password.
                  </Typography>
                </Box>
                <TextField
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  fullWidth
                />
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
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  variant="contained"
                  onClick={handleSavePassword}
                  disabled={
                    !newPassword ||
                    newPassword !== confirmPassword ||
                    isUserSaving
                  }
                  sx={{ alignSelf: "flex-start" }}
                >
                  Update password
                </Button>
              </Stack>
            )}

            {section === "email" && (
              <Stack
                spacing={2}
                sx={{ minHeight: 320, display: "flex" }}
                alignItems="flex-start"
              >
                <Box>
                  <Typography variant="h6">Email verification</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verify your email address.
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Verification emails will be sent from this account. This
                  action will be available soon.
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  variant="outlined"
                  disabled
                  sx={{ alignSelf: "flex-start" }}
                >
                  Send verification email
                </Button>
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
