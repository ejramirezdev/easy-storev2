import WhatsAppFab from "@/components/home/WhatsAppFab";
import { Box, Button, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";

const whatsappNumber = "+593958720950";

export const metadata = {
  title: "Servicios | Easy Store",
  description:
    "Servicios de desarrollo de software a medida y reparación de equipos informáticos. Soluciones tecnológicas personalizadas para tu negocio.",
};

export default function ServicesPage() {
  return (
    <>
      <Box
        component="main"
        sx={{
          position: "relative",
          color: "text.primary",
          minHeight: "100vh",
          pb: { xs: 10, md: 14 },
          background:
            "radial-gradient(circle at 12% 18%, rgba(120,0,190,0.35), transparent 45%), " +
            "radial-gradient(circle at 88% 12%, rgba(102,0,255,0.25), transparent 55%), " +
            "radial-gradient(circle at 50% 85%, rgba(120,0,140,0.2), transparent 60%), #040308",
        }}
      >
        <Box
          sx={{
            maxWidth: 1240,
            mx: "auto",
            px: { xs: 3, md: 6 },
            pt: { xs: 8, md: 12 },
            display: "flex",
            flexDirection: "column",
            gap: { xs: 6, md: 8 },
          }}
        >
          {/* Header Section */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                letterSpacing: -1,
                mb: 2,
              }}
            >
              Nuestros Servicios
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 700, mx: "auto" }}
            >
              Ofrecemos soluciones tecnológicas completas para potenciar tu
              negocio y mantener tus equipos en óptimas condiciones.
            </Typography>
          </Box>

          {/* Services Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 4, md: 6 },
            }}
          >
            {/* Software a medida */}
            <Box
              sx={{
                position: "relative",
                minHeight: { xs: 400, md: 500 },
                background:
                  "linear-gradient(135deg, rgba(113,0,150,0.68) 0%, rgba(16,0,50,0.9) 55%, rgba(5,5,6,0.95) 100%)",
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
                transition: "transform 0.45s ease, box-shadow 0.45s ease",
                transformOrigin: "center",
                willChange: "transform",
                display: "flex",
                flexDirection: "column",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: "0 28px 55px rgba(0,0,0,0.45)",
                },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  flex: 1,
                  minHeight: { xs: 200, md: 280 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 4,
                  pt: 4,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: { xs: 20, md: 40 },
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(133,20,197,0.45), transparent 70%)",
                  }}
                />
                <Image
                  src="/services/software/laptop-coding.png"
                  alt="Software a medida"
                  fill
                  sizes="(min-width: 900px) 400px, 100vw"
                  style={{ objectFit: "contain" }}
                />
              </Box>
              <Box
                sx={{
                  p: { xs: 4, md: 5 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  Software a medida
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Desarrollo de aplicaciones web, sistemas empresariales y
                  soluciones personalizadas con las últimas tecnologías.
                  Transformamos tu idea en una realidad digital que impulse tu
                  negocio.
                </Typography>
                <Stack spacing={1} sx={{ pt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    • Desarrollo web y aplicaciones
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Tecnologías de punta y seguridad avanzada
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Bases de datos y arquitecturas escalables
                  </Typography>
                </Stack>
                <Box sx={{ pt: 2 }}>
                  <Link href="/services/software" passHref legacyBehavior>
                    <Button
                      component="a"
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                    >
                      Conocer más
                    </Button>
                  </Link>
                </Box>
              </Box>
            </Box>

            {/* Reparación de equipos */}
            <Box
              sx={{
                position: "relative",
                minHeight: { xs: 400, md: 500 },
                background:
                  "linear-gradient(135deg, rgba(37,0,76,0.88) 0%, rgba(12,0,60,0.9) 45%, rgba(5,5,6,0.95) 90%)",
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
                transition: "transform 0.45s ease, box-shadow 0.45s ease",
                transformOrigin: "center",
                willChange: "transform",
                display: "flex",
                flexDirection: "column",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: "0 28px 55px rgba(0,0,0,0.45)",
                },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  flex: 1,
                  minHeight: { xs: 200, md: 280 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 4,
                  pt: 4,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: { xs: 20, md: 40 },
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(133,20,197,0.45), transparent 70%)",
                  }}
                />
                <Image
                  src="/services/hardware/laptop-repair.png"
                  alt="Reparación de equipos"
                  fill
                  sizes="(min-width: 900px) 400px, 100vw"
                  style={{ objectFit: "contain" }}
                />
              </Box>
              <Box
                sx={{
                  p: { xs: 4, md: 5 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  Reparación de equipos
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Diagnóstico, reparación y mantenimiento profesional de equipos
                  informáticos. Garantizamos reparaciones con componentes de
                  calidad y servicio especializado.
                </Typography>
                <Stack spacing={1} sx={{ pt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    • Reparación de hardware y software
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Componentes de las mejores marcas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Diagnóstico y mantenimiento preventivo
                  </Typography>
                </Stack>
                <Box sx={{ pt: 2 }}>
                  <Link href="/services/hardware" passHref legacyBehavior>
                    <Button
                      component="a"
                      variant="contained"
                      color="secondary"
                      size="large"
                      fullWidth
                    >
                      Conocer más
                    </Button>
                  </Link>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <WhatsAppFab phone={whatsappNumber} />
    </>
  );
}
