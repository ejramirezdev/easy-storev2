"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  GridLegacy,
} from "@mui/material";

const formSchema = z.object({
  email: z.string().email("Debes ingresar un correo válido"),
  phone: z.string().min(1, "Debes ingresar tu número de teléfono"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SoftwareQuotePage() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      phone: "",
      description: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    setStatus("idle");
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/services/software/quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            phone: data.phone,
            description: data.description || "",
          }),
        });

        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "No se pudo enviar la solicitud");
        }

        setStatus("success");
        reset();
      } catch (e: any) {
        setStatus("error");
        setError(e.message || "Error al enviar la solicitud");
      }
    });
  };

  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        color: "text.primary",
        minHeight: "100vh",
        pb: { xs: 10, md: 14 },
        pt: { xs: 8, md: 12 },
        background:
          "radial-gradient(circle at 12% 18%, rgba(120,0,190,0.35), transparent 45%), " +
          "radial-gradient(circle at 88% 12%, rgba(102,0,255,0.25), transparent 55%), " +
          "radial-gradient(circle at 50% 85%, rgba(120,0,140,0.2), transparent 60%), #040308",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={4}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              Cotiza tu proyecto con nosotros
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Completa el formulario y nos pondremos en contacto contigo para
              discutir tu proyecto de software a medida.
            </Typography>
          </Box>

          <Paper
            sx={{
              p: { xs: 3, md: 5 },
              background:
                "linear-gradient(135deg, rgba(113,0,150,0.68) 0%, rgba(16,0,50,0.9) 55%, rgba(5,5,6,0.95) 100%)",
              borderRadius: 4,
              boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
            }}
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                {status === "success" && (
                  <Alert severity="success">
                    ¡Solicitud enviada exitosamente! Te contactaremos pronto.
                  </Alert>
                )}

                {status === "error" && error && (
                  <Alert severity="error">{error}</Alert>
                )}

                <GridLegacy container spacing={3}>
                  <GridLegacy item xs={12}>
                    <TextField
                      {...register("email")}
                      label="Correo electrónico"
                      type="email"
                      fullWidth
                      required
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      InputLabelProps={{ shrink: !!watch("email") }}
                    />
                  </GridLegacy>

                  <GridLegacy item xs={12}>
                    <TextField
                      {...register("phone")}
                      label="Número de teléfono"
                      type="tel"
                      fullWidth
                      required
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      InputLabelProps={{ shrink: !!watch("phone") }}
                    />
                  </GridLegacy>

                  <GridLegacy item xs={12}>
                    <TextField
                      {...register("description")}
                      label="Descripción del proyecto"
                      multiline
                      rows={6}
                      fullWidth
                      error={!!errors.description}
                      helperText={
                        errors.description?.message ||
                        "Opcional: Puedes describir brevemente tu proyecto o dejarlo en blanco si prefieres explicarlo más tarde."
                      }
                      InputLabelProps={{ shrink: !!watch("description") }}
                    />
                  </GridLegacy>
                </GridLegacy>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={isPending}
                  sx={{ mt: 2 }}
                >
                  {isPending ? "Enviando..." : "Solicitar cotización"}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
