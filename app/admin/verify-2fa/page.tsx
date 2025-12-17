"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyTwoFactorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("redirect") || "/admin";

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError("Por favor ingresa un código de 6 dígitos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/2fa/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        // La sesión 2FA se estableció en una cookie, simplemente redirigir
        console.log("[2FA Client] Autenticación exitosa, redirigiendo a:", redirectTo);
        router.push(redirectTo);
        // El estado de carga se mantendrá hasta que el componente se desmonte
        return;
      } else {
        const errorData = await res.json();
        console.error("[2FA Client] Error en autenticación:", errorData);
        setError(errorData.error || "Código inválido");
        setCode("");
        // Solo resetear loading si hay un error
        setLoading(false);
      }
    } catch (err) {
      console.error("[2FA Client] Error de conexión:", err);
      setError("Error al conectar con el servidor");
      // Solo resetear loading si hay un error
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Box textAlign="center">
            <Typography variant="h4" fontWeight={900} gutterBottom>
              Verificación 2FA
            </Typography>
            <Typography color="text.secondary">
              Ingresa el código de 6 dígitos de tu aplicación autenticadora para continuar.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Código de 6 dígitos"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyPress={handleKeyPress}
            placeholder="000000"
            inputProps={{ maxLength: 6, style: { textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" } }}
            fullWidth
            autoFocus
            disabled={loading}
          />

          <Button
            variant="contained"
            size="large"
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            fullWidth
            sx={{
              minHeight: "48px",
              position: "relative",
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} sx={{ color: "inherit" }} />
                <Typography component="span">Verificando...</Typography>
              </Box>
            ) : (
              "Verificar"
            )}
          </Button>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            Si perdiste acceso a tu dispositivo autenticador, puedes usar uno de tus códigos de
            respaldo.
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}

