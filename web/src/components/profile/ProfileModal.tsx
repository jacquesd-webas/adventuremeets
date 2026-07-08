import {
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useCurrentOrganization } from "../../context/organizationContext";
import { PersonalDetails } from "./PersonalDetails";
import { MyOrganization } from "./MyOrganization";
import { OrganizationInvites } from "./OrganizationInvites";
import { ProfileSecurity } from "./ProfileSecurity";
import { ProfileAutoFill } from "./ProfileAutoFill";
import { ProfileICE } from "./ProfileICE";
import { ProfileAvatar } from "./ProfileAvatar";

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

type ProfileContentProps = {
  open: boolean;
};

export function ProfileContent({ open: _open }: ProfileContentProps) {
  const { currentOrganizationRole } = useCurrentOrganization();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [section, setSection] = useState<
    | "personal"
    | "organization"
    | "invites"
    | "security"
    | "autofill"
    | "emergency"
    | "avatar"
  >("personal");
  const isAdmin = currentOrganizationRole === "admin";

  const sections = [
    { key: "personal", label: "Personal details" },
    { key: "organization", label: "Organisation" },
    ...(isAdmin ? [{ key: "invites", label: "Invites" }] : []),
    { key: "security", label: "Security" },
    { key: "autofill", label: "AutoFill" },
    { key: "emergency", label: "Emergency Info" },
    { key: "avatar", label: "Avatar" },
  ] as const;

  if (isMobile) {
    return (
      <Stack divider={<Divider flexItem />} spacing={2}>
        <PersonalDetails />
        <MyOrganization />
        {isAdmin ? <OrganizationInvites /> : null}
        <ProfileSecurity />
        <ProfileAutoFill />
        <ProfileICE />
        <ProfileAvatar />
      </Stack>
    );
  }

  return (
    <Grid container spacing={2} sx={{ mt: 0 }}>
      <Grid item xs={12} sm={4} md={3}>
        <List component="nav">
          {sections.map((item) => (
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
        {section === "personal" ? <PersonalDetails /> : null}
        {section === "organization" ? <MyOrganization /> : null}
        {section === "invites" ? <OrganizationInvites /> : null}
        {section === "security" ? <ProfileSecurity /> : null}
        {section === "autofill" ? <ProfileAutoFill /> : null}
        {section === "emergency" ? <ProfileICE /> : null}
        {section === "avatar" ? <ProfileAvatar /> : null}
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
