import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useMemo, useState, MouseEvent } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ProfileModal } from "../components/ProfileModal";
import { getLogoSrc } from "../helpers/logo";
import { useThemeMode } from "../context/ThemeModeContext";
import { useAuth } from "../context/authContext";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentOrganization } from "../context/organizationContext";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { ChooseOrganizationModal } from "../components/ChooseOrganizationModal";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Calendar", path: "/calendar" },
  { label: "List", path: "/plan" },
];

function MainLayout() {
  const nav = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [adminAnchorEl, setAdminAnchorEl] = useState<null | HTMLElement>(null);
  const [orgModalOpen, setOrgModalOpen] = useState(false);

  const { user } = useAuth();
  const { currentOrganizationId, organizationIds, currentOrganizationRole } =
    useCurrentOrganization();
  const { data: organization } = useFetchOrganization(
    currentOrganizationId || undefined
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const { mode, toggleMode } = useThemeMode();
  const queryClient = useQueryClient();
  const isAdmin = Boolean(
    user?.organizations && Object.values(user.organizations).includes("admin")
  );
  const isCurrentOrgAdmin = currentOrganizationRole === "admin";

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

  const handleMenuClose = () => setAnchorEl(null);
  const handleAdminClose = () => setAdminAnchorEl(null);

  const handleNavigate = (path: string) => {
    nav(path);
    handleMenuClose();
  };
  const handleAdminNavigate = (path: string) => {
    nav(path);
    handleAdminClose();
  };
  const handleAdminTemplates = () => {
    if (currentOrganizationId) {
      nav(`/admin/organizations/${currentOrganizationId}/templates`);
    }
    handleAdminClose();
  };

  const handleProfile = () => {
    setProfileOpen(true);
    handleMenuClose();
  };

  const handleLogout = () => {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("refreshToken");
    queryClient.clear();
    handleMenuClose();
    nav("/login");
  };

  const handleToggleMode = () => {
    toggleMode();
    handleMenuClose();
  };

  const logoSrc = getLogoSrc(mode);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {!isMobile && (
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: "divider", top: 0 }}
        >
          <Toolbar>
            <Box
              component="img"
              src={logoSrc}
              alt="AdventureMeets logo"
              sx={{ height: 36, mr: 3 }}
            />
            <Stack direction="row" spacing={2} alignItems="center">
              {navItems.map((item) => (
                <Box
                  key={item.path}
                  component="button"
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "text.primary",
                  }}
                >
                  {item.label}
                </Box>
              ))}
              {isAdmin && (
                <Box
                  component="button"
                  onClick={(event) => setAdminAnchorEl(event.currentTarget)}
                  sx={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "text.primary",
                  }}
                >
                  Admin
                </Box>
              )}
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            {organizationIds.length > 1 && (
              <Button
                onClick={() => setOrgModalOpen(true)}
                variant="outlined"
                color="primary"
                size="small"
                sx={{
                  mr: 2,
                  maxWidth: 240,
                  textTransform: "none",
                  fontWeight: 600,
                  justifyContent: "flex-start",
                }}
              >
                <Typography variant="body2" noWrap>
                  {currentOrganizationId
                    ? organization?.name || "Organisation"
                    : "No Organisation"}
                </Typography>
              </Button>
            )}
            <Tooltip title="Account">
              <IconButton
                onClick={handleAvatarClick}
                size="small"
                sx={{ ml: 2 }}
              >
                <Avatar sx={{ width: 36, height: 36 }}>{initials}</Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={handleToggleMode}>
                <ListItemIcon>
                  {mode === "light" ? (
                    <DarkModeIcon fontSize="small" />
                  ) : (
                    <LightModeIcon fontSize="small" />
                  )}
                </ListItemIcon>
                {mode === "light" ? "Dark mode" : "Light mode"}
              </MenuItem>
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <PersonOutlineIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
            {isAdmin && (
              <Menu
                anchorEl={adminAnchorEl}
                open={Boolean(adminAnchorEl)}
                onClose={handleAdminClose}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
              >
                <MenuItem
                  onClick={() => handleAdminNavigate("/admin/organizations")}
                >
                  Organisations
                </MenuItem>
                <MenuItem
                  onClick={handleAdminTemplates}
                  disabled={!organizationIds.length || !isCurrentOrgAdmin}
                >
                  Templates
                </MenuItem>
                <MenuItem
                  onClick={() => handleAdminNavigate("/admin/users")}
                  disabled={!isCurrentOrgAdmin}
                >
                  Users
                </MenuItem>
              </Menu>
            )}
          </Toolbar>
        </AppBar>
      )}
      <Container
        maxWidth={isMobile ? false : "lg"}
        disableGutters={isMobile}
        sx={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",
          py: isMobile ? 1 : 3,
          px: isMobile ? 1.5 : 0,
        }}
      >
        <Outlet />
      </Container>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ChooseOrganizationModal
        open={orgModalOpen || !currentOrganizationId}
        onClose={() => setOrgModalOpen(false)}
      />
    </Box>
  );
}

export default MainLayout;
