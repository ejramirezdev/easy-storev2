"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Button,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Divider,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import { useState } from "react";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";
import HistoryIcon from "@mui/icons-material/History";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { isAdminEmail } from "@/lib/admin-utils";

type Props = {
  mode?: "desktop" | "mobile";
  onClickAfter?: () => void; // útil para cerrar el menú móvil
};

export default function AuthButtons({ mode = "desktop", onClickAfter }: Props) {
  const { data: session, status } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isDesktop = mode === "desktop";
  const isAdmin = isAdminEmail(session?.user?.email ?? null);

  if (status === "loading") {
    return (
      <Box
        sx={{
          display: isDesktop
            ? { xs: "none", md: "flex" }
            : { xs: "flex", md: "none" },
          alignItems: "center",
          justifyContent: "center",
          height: 40,
          px: isDesktop ? 0 : 1.5,
        }}
      >
        <CircularProgress size={24} sx={{ color: "#fff" }} />
      </Box>
    );
  }

  // ------ NO LOGUEADO ------
  if (!session) {
    if (isDesktop) {
      // Botón con tu mismo estilo (visible solo en md+)
      return (
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LoginIcon />}
          onClick={() => signIn("google")}
          sx={{
            borderColor: "rgba(255,255,255,0.3)",
            display: { xs: "none", md: "inline-flex" },
            textTransform: "none",
            fontWeight: 600,
            px: 2,
            py: 0.6,
            "&:hover": {
              borderColor: "#fff",
              backgroundColor: "rgba(255,255,255,0.05)",
            },
          }}
        >
          Iniciar sesión
        </Button>
      );
    }

    // Móvil: MenuItem consistente con el resto del menú
    return (
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />
        <MenuItem
          onClick={() => {
            onClickAfter?.();
            signIn("google");
          }}
          sx={{
            py: 1.5,
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.08)",
            },
          }}
        >
          <LoginIcon sx={{ fontSize: 18, mr: 1.5 }} /> Iniciar sesión
        </MenuItem>
      </Box>
    );
  }

  // ------ LOGUEADO ------
  if (isDesktop) {
    // Desktop: Avatar + menú
    return (
      <>
        <Avatar
          src={session.user?.image || ""}
          alt={session.user?.name || ""}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            cursor: "pointer",
            width: 36,
            height: 36,
            border: "2px solid rgba(255,255,255,0.3)",
            display: { xs: "none", md: "inline-flex" },
            "&:hover": { borderColor: "#fff" },
          }}
        />
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              bgcolor: "#141414",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        >
          <MenuItem disabled>
            <Typography variant="body2">{session.user?.name}</Typography>
          </MenuItem>
          <MenuItem
            component={Link}
            href="/account/profile"
            onClick={() => setAnchorEl(null)}
          >
            <PersonIcon sx={{ fontSize: 18, mr: 1 }} /> Mi perfil
          </MenuItem>
          <MenuItem
            component={Link}
            href="/account/orders"
            onClick={() => setAnchorEl(null)}
          >
            <HistoryIcon sx={{ fontSize: 18, mr: 1 }} /> Historial de compras
          </MenuItem>
          <MenuItem
            component={Link}
            href="/account/favorites"
            onClick={() => setAnchorEl(null)}
          >
            <FavoriteBorderIcon sx={{ fontSize: 18, mr: 1 }} /> Favoritos
          </MenuItem>
          {isAdmin && (
            <MenuItem
              component={Link}
              href="/admin"
              onClick={() => setAnchorEl(null)}
            >
              <AdminPanelSettingsIcon sx={{ fontSize: 18, mr: 1 }} /> Panel
              admin
            </MenuItem>
          )}
          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              signOut();
            }}
          >
            <LogoutIcon sx={{ fontSize: 18, mr: 1 }} /> Cerrar sesión
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Móvil: MenuItem estilo consistente con el resto del menú
  return (
    <Box sx={{ display: { xs: "block", md: "none" } }}>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />
      <MenuItem disabled sx={{ opacity: 0.7, py: 1.5 }}>
        <Avatar
          src={session.user?.image || ""}
          alt={session.user?.name || ""}
          sx={{
            width: 32,
            height: 32,
            mr: 1.5,
            border: "2px solid rgba(255,255,255,0.3)",
          }}
        />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {session.user?.name}
        </Typography>
      </MenuItem>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />
      
      <MenuItem
        component={Link}
        href="/account/profile"
        onClick={() => onClickAfter?.()}
      >
        <PersonIcon sx={{ fontSize: 18, mr: 1.5 }} /> Mi perfil
      </MenuItem>
      
      <MenuItem
        component={Link}
        href="/account/orders"
        onClick={() => onClickAfter?.()}
      >
        <HistoryIcon sx={{ fontSize: 18, mr: 1.5 }} /> Historial de compras
      </MenuItem>
      
      <MenuItem
        component={Link}
        href="/account/favorites"
        onClick={() => onClickAfter?.()}
      >
        <FavoriteBorderIcon sx={{ fontSize: 18, mr: 1.5 }} /> Favoritos
      </MenuItem>

      {isAdmin && (
        <MenuItem
          component={Link}
          href="/admin"
          onClick={() => onClickAfter?.()}
          sx={{
            bgcolor: "rgba(216, 27, 156, 0.1)",
            "&:hover": {
              bgcolor: "rgba(216, 27, 156, 0.2)",
            },
          }}
        >
          <AdminPanelSettingsIcon sx={{ fontSize: 18, mr: 1.5, color: "#D81B9C" }} /> 
          Panel admin
        </MenuItem>
      )}

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />
      
      <MenuItem
        onClick={() => {
          onClickAfter?.();
          signOut();
        }}
        sx={{
          color: "rgba(255, 100, 100, 0.9)",
          "&:hover": {
            bgcolor: "rgba(255, 100, 100, 0.1)",
          },
        }}
      >
        <LogoutIcon sx={{ fontSize: 18, mr: 1.5 }} /> Cerrar sesión
      </MenuItem>
    </Box>
  );
}
