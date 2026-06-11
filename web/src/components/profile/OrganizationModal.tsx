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
import { OrganizationCreate } from "./OrganizationCreate";
import { OrganizationFeatures } from "./OrganizationFeatures";
import { MyOrganization } from "./MyOrganization";
import { OrganizationFields } from "./OrganizationFields";
import { OrganizationInvites } from "./OrganizationInvites";
import { OrganizationPrivacy } from "./OrganizationPrivacy";
import { OrganizationStats } from "./OrganizationStats";

type OrganizationModalProps = {
  open: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
};

type OrganizationContentProps = {
  open: boolean;
  onOpenProfile?: () => void;
};

type OrganizationSection =
  | "organization"
  | "fields"
  | "stats"
  | "features"
  | "privacy"
  | "invites"
  | "create";

export function OrganizationContent({
  open: _open,
  onOpenProfile,
}: OrganizationContentProps) {
  const { currentOrganizationRole } = useCurrentOrganization();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [section, setSection] = useState<OrganizationSection>("organization");
  const isAdmin = currentOrganizationRole === "admin";

  const sections = [
    { key: "organization", label: "Theme" },
    ...(isAdmin ? [{ key: "privacy", label: "Privacy" }] : []),
    ...(isAdmin ? [{ key: "invites", label: "Invites" }] : []),
    ...(isAdmin ? [{ key: "fields", label: "Fields" }] : []),
    { key: "stats", label: "Stats" },
    { key: "features", label: "Features" },
    { key: "create", label: "Create" },
  ] as const satisfies ReadonlyArray<{
    key: OrganizationSection;
    label: string;
  }>;

  if (isMobile) {
    return (
      <Stack divider={<Divider flexItem />} spacing={2}>
        <MyOrganization
          title="Organisation Theme"
          description="Update your organisation name and look and feel."
        />
        {isAdmin ? <OrganizationPrivacy /> : null}
        {isAdmin ? <OrganizationInvites /> : null}
        {isAdmin ? <OrganizationFields /> : null}
        <OrganizationStats />
        <OrganizationFeatures />
        <OrganizationCreate onGoToProfile={onOpenProfile} />
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
              onClick={() => setSection(item.key)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Grid>
      <Grid item xs={12} sm={8} md={9}>
        {section === "organization" ? (
          <MyOrganization
            title="Theme"
            description="Update your organisation name and look and feel."
          />
        ) : null}
        {section === "fields" ? <OrganizationFields /> : null}
        {section === "stats" ? <OrganizationStats /> : null}
        {section === "features" ? <OrganizationFeatures /> : null}
        {section === "privacy" ? <OrganizationPrivacy /> : null}
        {section === "invites" ? <OrganizationInvites /> : null}
        {section === "create" ? (
          <OrganizationCreate onGoToProfile={onOpenProfile} />
        ) : null}
      </Grid>
    </Grid>
  );
}

export function OrganizationModal({
  open,
  onClose,
  onOpenProfile,
}: OrganizationModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      data-testid="organization-modal"
      PaperProps={{ sx: { minHeight: "80vh" } }}
    >
      <DialogTitle>Organisation</DialogTitle>
      <DialogContent dividers>
        <OrganizationContent open={open} onOpenProfile={onOpenProfile} />
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={onClose} data-testid="close-organization-modal">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
