import React, { useState } from "react";
import {
  AppBar, Toolbar, Container, Box, Button, IconButton, Menu, MenuItem, Typography, Stack, Divider,
} from "@mui/material";
import BlurOnIcon from "@mui/icons-material/BlurOn";
import MenuIcon from "@mui/icons-material/Menu";
import { NavLink as RouterNavLink } from "react-router-dom";

const NAV_ITEMS = [
  { label: "About Us", to: "/aboutUsPage" },
  { label: "FAQ", to: "/FAQPage" },
  { label: "Contact Us", to: "/contactUsPage" },
];

const AppHeader = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const activeSx = { "&.active": { color: "primary.main", fontWeight: 700 } };

  return (
    <AppBar position="static" className="no-print" sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2 }}>
          {/* Brand */}
          <Box
            component={RouterNavLink}
            to="/"
            sx={{ display: "flex", alignItems: "center", textDecoration: "none", color: "text.primary", mr: "auto" }}
          >
            <BlurOnIcon sx={{ fontSize: 40, color: "primary.main", mr: 1 }} />
            <Typography variant="h5" component="span" sx={{ fontWeight: 700 }}>
              PayStub<Box component="span" sx={{ color: "primary.main" }}>Issa</Box>
            </Typography>
          </Box>

          {/* Desktop nav */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
            {NAV_ITEMS.map(item => (
              <Button key={item.to} component={RouterNavLink} to={item.to} color="inherit" sx={activeSx}>
                {item.label}
              </Button>
            ))}
            <Button component={RouterNavLink} to="/create" variant="contained">
              Create pay stub
            </Button>
          </Stack>

          {/* Mobile menu */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton aria-label="Open navigation menu" onClick={openMenu} color="inherit" edge="end">
              <MenuIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu} keepMounted>
              {NAV_ITEMS.map(item => (
                <MenuItem key={item.to} component={RouterNavLink} to={item.to} onClick={closeMenu}>
                  {item.label}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem component={RouterNavLink} to="/create" onClick={closeMenu} sx={{ color: "primary.main", fontWeight: 600 }}>
                Create pay stub
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default AppHeader;
