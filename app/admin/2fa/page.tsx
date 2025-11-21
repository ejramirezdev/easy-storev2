"use client";

import { useState, useEffect, Suspense } from "react";
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TwoFactorStatus = {
  enabled: boolean;
};

function TwoFactorPageContent() {
  const router = useRouter();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para setup
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/2fa/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setError("Error al obtener estado de 2FA");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setSetupLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/2fa/setup");
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Error al configurar 2FA");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Por favor ingresa un código de 6 dígitos");
      return;
    }

    setVerifying(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: verificationCode,
          secret: secret,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBackupCodes(data.backupCodes);
        setShowBackupCodes(true);
        setSuccess("2FA activado correctamente");
        await fetchStatus();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Código inválido");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setError("Por favor ingresa un código de 6 dígitos");
      return;
    }

    setDisabling(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: disableCode,
        }),
      });

      if (res.ok) {
        setSuccess("2FA desactivado correctamente");
        setDisableCode("");
        await fetchStatus();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Código inválido");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setDisabling(false);
    }
  };

  const handleCancelSetup = () => {
    setQrCode(null);
    setSecret(null);
    setVerificationCode("");
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Link href="/admin" legacyBehavior passHref>
            <Button component="a" variant="text" sx={{ mb: 2 }}>
              ← Volver al panel admin
            </Button>
          </Link>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            Autenticación de Dos Factores (2FA)
          </Typography>
          <Typography color="text.secondary">
            Protege tu cuenta de administrador con autenticación de dos factores.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          {status?.enabled ? (
            <Stack spacing={3}>
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  2FA está activado en tu cuenta
                </Alert>
                <Typography variant="body1" gutterBottom>
                  Tu cuenta está protegida con autenticación de dos factores. Cada vez que
                  accedas al panel admin, necesitarás ingresar un código de tu aplicación
                  autenticadora.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Desactivar 2FA
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Para desactivar 2FA, necesitas ingresar un código válido de tu aplicación
                  autenticadora.
                </Typography>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <TextField
                    label="Código de 6 dígitos"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    inputProps={{ maxLength: 6 }}
                    sx={{ width: 200 }}
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDisable}
                    disabled={disabling || disableCode.length !== 6}
                  >
                    {disabling ? <CircularProgress size={24} /> : "Desactivar 2FA"}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          ) : qrCode ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Paso 1: Escanea el código QR
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Usa una aplicación autenticadora como Google Authenticator, Authy o Microsoft
                  Authenticator para escanear este código QR.
                </Typography>
                <Box
                  display="flex"
                  justifyContent="center"
                  sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}
                >
                  <img src={qrCode} alt="QR Code" style={{ maxWidth: "100%", height: "auto" }} />
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Paso 2: Verifica el código
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Ingresa el código de 6 dígitos que aparece en tu aplicación autenticadora
                  para activar 2FA.
                </Typography>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <TextField
                    label="Código de 6 dígitos"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    inputProps={{ maxLength: 6 }}
                    sx={{ width: 200 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleVerify}
                    disabled={verifying || verificationCode.length !== 6}
                  >
                    {verifying ? <CircularProgress size={24} /> : "Verificar y Activar"}
                  </Button>
                  <Button variant="outlined" onClick={handleCancelSetup}>
                    Cancelar
                  </Button>
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body1">
                2FA no está activado en tu cuenta. Actívalo para añadir una capa adicional de
                seguridad.
              </Typography>
              <Button
                variant="contained"
                onClick={handleSetup}
                disabled={setupLoading}
                sx={{ alignSelf: "flex-start" }}
              >
                {setupLoading ? <CircularProgress size={24} /> : "Activar 2FA"}
              </Button>
            </Stack>
          )}
        </Paper>

        {/* Dialog para mostrar códigos de respaldo */}
        <Dialog
          open={showBackupCodes}
          onClose={() => setShowBackupCodes(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Códigos de Respaldo</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                ¡Importante! Guarda estos códigos en un lugar seguro.
              </Typography>
              <Typography variant="body2">
                Estos códigos te permitirán acceder a tu cuenta si pierdes acceso a tu
                dispositivo autenticador. Cada código solo se puede usar una vez.
              </Typography>
            </Alert>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {backupCodes?.map((code, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <Paper
                    sx={{
                      p: 1.5,
                      textAlign: "center",
                      bgcolor: "background.default",
                      fontFamily: "monospace",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                    }}
                  >
                    {code}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBackupCodes(false)} variant="contained">
              He guardado los códigos
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    }>
      <TwoFactorPageContent />
    </Suspense>
  );
}

