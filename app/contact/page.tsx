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
  Link,
} from "@mui/material";
import WhatsAppFab from "@/components/home/WhatsAppFab";

const whatsappNumber = "+593958720950";
const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`;
const contactEmail = "easystoreecu@gmail.com";

const formSchema = z.object({
  subject: z.string().min(1, "El asunto es requerido"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
  email: z.string().email("Debes ingresar un correo válido"),
  phone: z.string().min(1, "El número de teléfono es requerido"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContactPage() {
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
      subject: "",
      message: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    setStatus("idle");
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: data.subject,
            message: data.message,
            email: data.email,
            phone: data.phone,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "No se pudo enviar el mensaje");
        }

        setStatus("success");
        reset();
      } catch (e: any) {
        setStatus("error");
        setError(e.message || "Error al enviar el mensaje");
      }
    });
  };

  return (
    <>
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
        <Container maxWidth="lg">
          <Stack spacing={6}>
            {/* Header */}
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
                Contáctanos
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos
                lo antes posible.
              </Typography>
            </Box>

            <GridLegacy container spacing={4}>
              {/* Información de contacto */}
              <GridLegacy item xs={12} md={4}>
                <Stack spacing={4}>
                  <Paper
                    sx={{
                      p: 4,
                      background:
                        "linear-gradient(135deg, rgba(113,0,150,0.68) 0%, rgba(16,0,50,0.9) 55%, rgba(5,5,6,0.95) 100%)",
                      borderRadius: 4,
                      boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
                      Información de contacto
                    </Typography>
                    <Stack spacing={3}>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          Correo electrónico
                        </Typography>
                        <Link
                          href={`mailto:${contactEmail}`}
                          color="primary"
                          sx={{ textDecoration: "none", fontSize: "1rem" }}
                        >
                          {contactEmail}
                        </Link>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          Teléfono
                        </Typography>
                        <Link
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          color="primary"
                          sx={{ textDecoration: "none", fontSize: "1rem" }}
                        >
                          {whatsappNumber}
                        </Link>
                      </Box>
                    </Stack>
                  </Paper>
                </Stack>
              </GridLegacy>

              {/* Formulario */}
              <GridLegacy item xs={12} md={8}>
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
                          ¡Mensaje enviado exitosamente! Te contactaremos pronto.
                        </Alert>
                      )}

                      {status === "error" && error && (
                        <Alert severity="error">{error}</Alert>
                      )}

                      <GridLegacy container spacing={3}>
                        <GridLegacy item xs={12}>
                          <TextField
                            {...register("subject")}
                            label="Asunto"
                            fullWidth
                            required
                            error={!!errors.subject}
                            helperText={errors.subject?.message}
                            InputLabelProps={{ shrink: !!watch("subject") }}
                          />
                        </GridLegacy>

                        <GridLegacy item xs={12}>
                          <TextField
                            {...register("message")}
                            label="Mensaje"
                            multiline
                            rows={6}
                            fullWidth
                            required
                            error={!!errors.message}
                            helperText={errors.message?.message}
                            InputLabelProps={{ shrink: !!watch("message") }}
                          />
                        </GridLegacy>

                        <GridLegacy item xs={12} sm={6}>
                          <TextField
                            {...register("email")}
                            label="Tu correo electrónico"
                            type="email"
                            fullWidth
                            required
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            InputLabelProps={{ shrink: !!watch("email") }}
                          />
                        </GridLegacy>

                        <GridLegacy item xs={12} sm={6}>
                          <TextField
                            {...register("phone")}
                            label="Tu número de teléfono"
                            type="tel"
                            fullWidth
                            required
                            error={!!errors.phone}
                            helperText={errors.phone?.message}
                            InputLabelProps={{ shrink: !!watch("phone") }}
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
                        {isPending ? "Enviando..." : "Enviar mensaje"}
                      </Button>
                    </Stack>
                  </form>
                </Paper>
              </GridLegacy>
            </GridLegacy>
          </Stack>
        </Container>
      </Box>

      <WhatsAppFab phone={whatsappNumber} />
    </>
  );
}
