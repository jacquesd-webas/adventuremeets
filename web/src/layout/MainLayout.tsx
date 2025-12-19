import { AppBar, Avatar, Box, Container, IconButton, Menu, MenuItem, Stack, Toolbar, Tooltip } from "@mui/material";
import { useMemo, useState, MouseEvent } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useMe } from "../hooks/useMe";
import { ProfileModal } from "../components/ProfileModal";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Plan", path: "/plan" }
];

function MainLayout() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user } = useMe();
  const [profileOpen, setProfileOpen] = useState(false);

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

  const handleNavigate = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const handleProfile = () => {
    setProfileOpen(true);
    handleMenuClose();
  };

  const handleLogout = () => {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("refreshToken");
    handleMenuClose();
    navigate("/login");
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <Box component="img" src="/static/adventuremeets-logo.svg" alt="AdventureMeets logo" sx={{ height: 36, mr: 3 }} />
          <Stack direction="row" spacing={2} alignItems="center">
            {navItems.map((item) => (
              <Box
                key={item.path}
                component="button"
                onClick={() => handleNavigate(item.path)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: 600
                }}
              >
                {item.label}
              </Box>
            ))}
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Account">
            <IconButton onClick={handleAvatarClick} size="small" sx={{ ml: 2 }}>
              <Avatar sx={{ width: 36, height: 36 }}>{initials}</Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} transformOrigin={{ vertical: "top", horizontal: "right" }}>
            <MenuItem onClick={handleProfile}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </Box>
  );
}

export default MainLayout;
