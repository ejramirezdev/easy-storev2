"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";

type Settings = {
  id?: string;
  token: string | null;
  storeId: string | null;
  environment: string | null;
  merchantEmail: string | null;
  merchantName: string | null;
  responseUrl: string | null;
};

export default function AdminPayphoneSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/payphone-settings", { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo cargar settings");
        setSettings(
          json.settings || {
            token: null,
            storeId: null,
            environment: "sandbox",
            merchantEmail: null,
            merchantName: null,
            responseUrl: null,
          }
        );
      } catch (e: any) {
        setError(e.message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = () => {
    if (!settings) return;
    setError(null);
    setMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/payphone-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo guardar");
        setMsg("Configuración guardada");
        setSettings(json.settings);
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  if (!settings) {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Payphone</Typography>
        <Typography variant="body2" color="text.secondary">
          Cargando…
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Configuración de pagos (Payphone)</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {msg && <Alert severity="success">{msg}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Token (Bearer Token)"
              type="password"
              fullWidth
              value={settings.token ?? ""}
              onChange={(e) => {
                let tokenValue = e.target.value;
                // Remover "Bearer " si el usuario lo incluye por error al inicio
                tokenValue = tokenValue.trim().replace(/^Bearer\s+/i, '');
                setSettings({ ...settings, token: tokenValue || null });
              }}
              helperText="Token de autenticación obtenido de Payphone Developer. NO incluir 'Bearer' - solo el token."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Store ID (Id Cliente)"
              fullWidth
              value={settings.storeId ?? ""}
              onChange={(e) => setSettings({ ...settings, storeId: e.target.value || null })}
              helperText="ID del comercio obtenido de Payphone Developer"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Entorno"
              fullWidth
              select
              SelectProps={{ native: true }}
              value={settings.environment ?? "sandbox"}
              onChange={(e) => setSettings({ ...settings, environment: e.target.value || null })}
            >
              <option value="sandbox">Sandbox (Pruebas)</option>
              <option value="production">Production (Producción)</option>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Email del comercio"
              type="email"
              fullWidth
              value={settings.merchantEmail ?? ""}
              onChange={(e) => setSettings({ ...settings, merchantEmail: e.target.value || null })}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Nombre del comercio"
              fullWidth
              value={settings.merchantName ?? ""}
              onChange={(e) => setSettings({ ...settings, merchantName: e.target.value || null })}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="URL de Respuesta"
              fullWidth
              value={settings.responseUrl ?? ""}
              onChange={(e) => setSettings({ ...settings, responseUrl: e.target.value || null })}
              helperText="URL a la que Payphone redirige después del pago (ej: http://localhost:3000/api/payphone/callback)"
            />
          </Grid>
        </Grid>

        <Box>
          <Button variant="contained" onClick={save} disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

