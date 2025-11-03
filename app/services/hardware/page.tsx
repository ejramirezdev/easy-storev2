import WhatsAppFab from "@/components/home/WhatsAppFab";
import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";

const whatsappNumber = "+593958720950";
const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`;
const scheduleHref = "/services/hardware/schedule";

export const metadata = {
  title: "Servicios de hardware | Easy Store",
  description:
    "Diagnóstico, reparación y mantenimiento profesional de equipos informáticos con componentes de calidad garantizada.",
};

export default function HardwareServicesPage() {
  return (
    <>
      <Box
        component="main"
        sx={{
          bgcolor: "#050506",
          color: "text.primary",
          minHeight: "100vh",
          pb: { xs: 10, md: 14 },
        }}
      >
        <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 } }}>
          <Stack spacing={{ xs: 6, md: 8 }}>
            <Box
              sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 5,
                px: { xs: 4, md: 6 },
                py: { xs: 6, md: 8 },
                background:
                  "radial-gradient(120% 120% at 10% 10%, rgba(216,27,156,0.35), transparent 55%), linear-gradient(150deg, rgba(12,12,16,0.95), rgba(12,12,16,0.65))",
                border: "1px solid rgba(216,27,156,0.28)",
                boxShadow: "0 45px 80px rgba(12, 12, 16, 0.45)",
              }}
            >
              <Grid container spacing={{ xs: 6, md: 4 }} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 800,
                        letterSpacing: -1,
                        maxWidth: 460,
                        lineHeight: 1.05,
                      }}
                    >
                      Repara tu equipo
                    </Typography>
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ maxWidth: 480 }}
                    >
                      Garantiza una reparación con componentes de las mejores marcas.
                      Ingresa tu equipo con nosotros y te lo entregaremos como nuevo.
                    </Typography>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      sx={{ pt: 2 }}
                    >
                      <Button
                        component="a"
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="contained"
                        color="primary"
                        size="large"
                      >
                        Contáctame
                      </Button>
                      <Link href={scheduleHref} passHref legacyBehavior>
                        <Button
                          component="a"
                          variant="outlined"
                          color="secondary"
                          size="large"
                          sx={{ borderWidth: 2 }}
                        >
                          Agenda una cita
                        </Button>
                      </Link>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      position: "relative",
                      minHeight: { xs: 240, md: 320 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        inset: { xs: 20, md: 40 },
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(138,43,226,0.45), transparent 70%)",
                        filter: "blur(0.5px)",
                      }}
                    />
                    <Image
                      src="/hero/hero-hardware.png"
                      alt="Laptop abierta mostrando componentes internos"
                      fill
                      priority
                      sizes="(min-width: 1200px) 500px, (min-width: 900px) 360px, 80vw"
                      style={{ objectFit: "contain" }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: 5,
                    overflow: "hidden",
                    px: { xs: 4, md: 5 },
                    py: { xs: 5, md: 6 },
                    background:
                      "linear-gradient(140deg, rgba(138,43,226,0.38), rgba(10,10,11,0.92)), url(/hero/hero-products.png)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    minHeight: { xs: 260, md: 320 },
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    gap: 1.5,
                    border: "1px solid rgba(138,43,226,0.25)",
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Mejora y repotencia
                  </Typography>
                  <Typography color="text.secondary" sx={{ maxWidth: 360 }}>
                    Dale una nueva vida a tu computadora con actualizaciones de
                    memoria, almacenamiento y tarjetas gráficas.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    borderRadius: 5,
                    px: { xs: 4, md: 5 },
                    py: { xs: 5, md: 6 },
                    bgcolor: "rgba(15,15,18,0.95)",
                    border: "1px solid rgba(216,27,156,0.25)",
                    minHeight: { xs: 260, md: 320 },
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    justifyContent: "space-between",
                  }}
                >
                  <Stack spacing={2}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      Experiencia profesional
                    </Typography>
                    <Typography color="text.secondary" sx={{ maxWidth: 360 }}>
                      Más de 100 certificaciones en excelencia de hardware
                      respaldan cada reparación y diagnóstico especializado.
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        width: 148,
                        height: 148,
                        borderRadius: "50%",
                        border: "2px solid rgba(138,43,226,0.65)",
                        background: "radial-gradient(circle, rgba(138,43,226,0.22), rgba(10,10,11,0.9))",
                        boxShadow: "0 20px 45px rgba(138,43,226,0.28)",
                        flexShrink: 0,
                        p: 2,
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 800 }}>
                        10+
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{ letterSpacing: 1.5, fontWeight: 700 }}
                      >
                        CERTIFIED
                      </Typography>
                    </Box>

                    <Stack spacing={2} sx={{ flex: 1 }}>
                      <Typography color="text.secondary">
                        Acompañamiento personalizado, seguimiento continuo y
                        garantías extendidas para tu tranquilidad.
                      </Typography>
                      <Link href={scheduleHref} passHref legacyBehavior>
                        <Button
                          component="a"
                          variant="contained"
                          color="secondary"
                          size="large"
                        >
                          Agenda una cita
                        </Button>
                      </Link>
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Stack>
        </Container>
      </Box>

      <WhatsAppFab phone={whatsappNumber} />
    </>
  );
}
