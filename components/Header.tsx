"use client";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { useState } from "react";
import AuthButtons from "./AuthButtons";
import HeaderCartButton from "./cart/HeaderCartButton";

const nav = [
  { label: "Inicio", href: "/" },
  { label: "Productos", href: "/products" },
  { label: "Servicios", href: "/services" },
  { label: "Sobre mí", href: "/sobre-mi" },
  { label: "Contacto", href: "/contact" },
];
export default function Header() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: "rgba(12,12,16,0.9)", backdropFilter: "blur(6px)" }}
    >
      <Toolbar
        sx={{
          maxWidth: 1200,
          mx: "auto",
          width: "100%",
          gap: { xs: 1, md: 2 },
        }}
      >
        {/* Logo / Marca */}
        <Box component={Link} href="/" sx={{ textDecoration: "none", mr: 3 }}>
          <Typography
            variant="h6"
            fontWeight={900}
            sx={{ color: "#fff", letterSpacing: 0.5 }}
          >
            EASY<span style={{ color: "#D81B9C" }}> STORE</span>
          </Typography>
        </Box>

        {/* Menú desktop */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            gap: 2,
            flexGrow: 1,
          }}
        >
          {nav.map((i) => (
            <Button key={i.href} component={Link} href={i.href} color="inherit">
              {i.label}
            </Button>
          ))}
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 1,
          }}
        >
          <AuthButtons mode="desktop" />
          <HeaderCartButton />
        </Box>

        {/* Acciones móviles */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 0.75,
            ml: "auto",
          }}
        >
          <HeaderCartButton />
          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label="Abrir menú"
          >
            <MenuIcon />
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { bgcolor: "#141418" } }}
        >
          {nav.map((i) => (
            <MenuItem
              key={i.href}
              onClick={() => setAnchorEl(null)}
              component={Link}
              href={i.href}
            >
              {i.label}
            </MenuItem>
          ))}

          {/* Auth en móvil dentro del menú */}
          <AuthButtons mode="mobile" onClickAfter={() => setAnchorEl(null)} />
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
