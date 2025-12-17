import { AppBar, Avatar, Box, Container, IconButton, Menu, MenuItem, Stack, Toolbar, Tooltip } from "@mui/material";
import { useState, MouseEvent } from "react";
import { Outlet, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Plan", path: "/plan" },
  { label: "Reports", path: "/reports" }
];

function MainLayout() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleAvatarClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleNavigate = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <Box component="img" src="/static/meetplanner-mark.svg" alt="Logo" sx={{ height: 36, mr: 3 }} />
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
              <Avatar sx={{ width: 36, height: 36 }}>MP</Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} transformOrigin={{ vertical: "top", horizontal: "right" }}>
            <MenuItem onClick={() => handleNavigate("/profile")}>Profile</MenuItem>
            <MenuItem onClick={() => handleNavigate("/logout")}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}

export default MainLayout;
