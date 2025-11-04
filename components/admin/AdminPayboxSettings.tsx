"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";

type Settings = {
  id?: string;
  onlyCredit: boolean;
  onlyDebit: boolean;
  blockDeferred: boolean;
  extraFields: boolean;
  recurrentEnabled: boolean;
  amountVariable: boolean;
  planId: string | null;
  frequency: string | null;
  language: string | null;
  environment: string | null;
  merchantEmail: string | null;
  merchantName: string | null;
  responseUrl: string | null;
  confirmationUrl: string | null;
};

export default function AdminPayboxSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/paybox-settings", { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        if (!res.ok || !json?.ok) throw new Error(json?.error || "No se pudo cargar settings");
        setSettings(
          json.settings || {
            onlyCredit: false,
            onlyDebit: false,
            blockDeferred: false,
            extraFields: false,
            recurrentEnabled: false,
            amountVariable: false,
            planId: null,
            frequency: null,
            language: "es",
            environment: "sandbox",
            merchantEmail: null,
            merchantName: null,
            responseUrl: null,
            confirmationUrl: null,
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
        const res = await fetch("/api/admin/paybox-settings", {
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
        <Typography variant="h6">Paybox</Typography>
        <Typography variant="body2" color="text.secondary">Cargando…</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Configuración de pagos (Paybox)</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {msg && <Alert severity="success">{msg}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.onlyCredit}
                  onChange={(e) => setSettings({ ...settings, onlyCredit: e.target.checked })}
                />
              }
              label="Solo tarjeta de crédito"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.onlyDebit}
                  onChange={(e) => setSettings({ ...settings, onlyDebit: e.target.checked })}
                />
              }
              label="Solo tarjeta de débito"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.blockDeferred}
                  onChange={(e) => setSettings({ ...settings, blockDeferred: e.target.checked })}
                />
              }
              label="Bloquear diferidos"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.extraFields}
                  onChange={(e) => setSettings({ ...settings, extraFields: e.target.checked })}
                />
              }
              label="Pedir datos adicionales (dirección/teléfono)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.recurrentEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, recurrentEnabled: e.target.checked })
                  }
                />
              }
              label="Habilitar pagos recurrentes"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.amountVariable}
                  onChange={(e) => setSettings({ ...settings, amountVariable: e.target.checked })}
                />
              }
              label="Monto variable (plan)"
            />
            <TextField
              label="ID de Plan"
              fullWidth
              InputLabelProps={{ shrink: !!(settings.planId ?? "") }}
              value={settings.planId ?? ""}
              onChange={(e) => setSettings({ ...settings, planId: e.target.value })}
              sx={{ mt: 1 }}
            />
            <TextField
              label="Frecuencia (SEM, MEN, BME, TME, SME, ANU)"
              fullWidth
              InputLabelProps={{ shrink: !!(settings.frequency ?? "") }}
              value={settings.frequency ?? ""}
              onChange={(e) => setSettings({ ...settings, frequency: e.target.value })}
              sx={{ mt: 1 }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Idioma (es/us)"
              fullWidth
              InputLabelProps={{ shrink: !!(settings.language ?? "") }}
              value={settings.language ?? ""}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Entorno (sandbox/production)"
              fullWidth
              InputLabelProps={{ shrink: !!(settings.environment ?? "") }}
              value={settings.environment ?? ""}
              onChange={(e) => setSettings({ ...settings, environment: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Email del comercio"
              fullWidth
              InputLabelProps={{ shrink: !!(settings.merchantEmail ?? "") }}
              value={settings.merchantEmail ?? ""}
              onChange={(e) => setSettings({ ...settings, merchantEmail: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Nombre del comercio"
              fullWidth
              InputLabelProps={{ shrink: !!(settings.merchantName ?? "") }}
              value={settings.merchantName ?? ""}
              onChange={(e) => setSettings({ ...settings, merchantName: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Response URL"
              fullWidth
              InputLabelProps={{ shrink: !!(settings.responseUrl ?? "") }}
              value={settings.responseUrl ?? ""}
              onChange={(e) => setSettings({ ...settings, responseUrl: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Confirmation URL"
              fullWidth
              InputLabelProps={{ shrink: !!(settings.confirmationUrl ?? "") }}
              value={settings.confirmationUrl ?? ""}
              onChange={(e) => setSettings({ ...settings, confirmationUrl: e.target.value })}
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


