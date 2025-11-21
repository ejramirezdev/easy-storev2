import WhatsAppFab from "@/components/home/WhatsAppFab";
import { Box, Button, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

const whatsappNumber = "+593958720950";
const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`;
const scheduleHref = "/services/hardware/schedule";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easy-storev2.vercel.app";

export const metadata: Metadata = {
  title: "Reparación de Hardware y Equipos",
  description:
    "Diagnóstico, reparación y mantenimiento profesional de laptops y equipos informáticos en Ecuador. Componentes de calidad garantizada y servicio especializado.",
  keywords: [
    "reparación laptops Ecuador",
    "reparación hardware Ecuador",
    "mantenimiento computadoras Ecuador",
    "servicio técnico Ecuador",
    "reparación equipos Ecuador",
    "upgrade computadoras Ecuador",
  ],
  openGraph: {
    title: "Reparación de Hardware y Equipos | Easy Store",
    description: "Servicio profesional de reparación y mantenimiento de equipos informáticos con componentes de calidad en Ecuador.",
    url: `${siteUrl}/services/hardware`,
  },
  alternates: {
    canonical: `${siteUrl}/services/hardware`,
  },
};

export default function HardwareServicesPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Reparación de Hardware",
    "name": "Reparación de Hardware y Equipos",
    "description": "Diagnóstico, reparación y mantenimiento profesional de laptops y equipos informáticos en Ecuador. Componentes de calidad garantizada y servicio especializado.",
    "provider": {
      "@type": "Organization",
      "name": "Easy Store",
      "url": siteUrl,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+593958720950",
        "contactType": "customer service",
        "email": "easystoreecu@gmail.com"
      }
    },
    "areaServed": {
      "@type": "Country",
      "name": "Ecuador"
    },
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
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
            gap: { xs: 8, md: 12 },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
              gap: { xs: 5, md: 8 },
              alignItems: "center",
              background:
                "linear-gradient(135deg, rgba(113,0,150,0.68) 0%, rgba(16,0,50,0.9) 55%, rgba(5,5,6,0.95) 100%)",
              px: { xs: 4, md: 6 },
              py: { xs: 6, md: 8 },
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
              transition: "transform 0.45s ease, box-shadow 0.45s ease",
              transformOrigin: "center",
              willChange: "transform",
              "&:hover": {
                transform: "scale(1.02)",
                boxShadow: "0 28px 55px rgba(0,0,0,0.45)",
              },
            }}
          >
            <Stack spacing={2.5}>
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
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 520 }}>
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
            <Box
              sx={{
                position: "relative",
                minHeight: { xs: 280, md: 360 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: { xs: 16, md: 40 },
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(133,20,197,0.45), transparent 70%)",
                }}
              />
              <Image
                src="/services/hardware/laptop-repair.png"
                alt="Técnico reparando una laptop"
                fill
                priority
                sizes="(min-width: 1200px) 480px, (min-width: 900px) 400px, 80vw"
                style={{ objectFit: "contain" }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 6, md: 4 },
            }}
          >
            <Box
              sx={{
                position: "relative",
                minHeight: { xs: 320, md: 420 },
                overflow: "hidden",
                background:
                  "linear-gradient(140deg, rgba(12,0,40,0.9) 10%, rgba(5,5,6,0.65) 45%, rgba(5,5,6,0.92) 95%)",
                borderRadius: 4,
                boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
                transition: "transform 0.45s ease, box-shadow 0.45s ease",
                transformOrigin: "center",
                willChange: "transform",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: "0 28px 55px rgba(0,0,0,0.45)",
                },
              }}
            >
              <Image
                src="/services/hardware/upgrade1.png"
                alt="Componentes de computadora iluminados"
                fill
                sizes="(min-width: 1200px) 600px, (min-width: 900px) 50vw, 100vw"
                style={{ objectFit: "cover", filter: "brightness(0.65)" }}
              />
              <Box
                sx={{
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 2.5,
                  px: { xs: 4, md: 6 },
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  Mejora y repotencia
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 380 }}>
                  Dale una nueva vida a tu computadora con actualizaciones de memoria,
                  almacenamiento y tarjetas gráficas.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                background:
                  "linear-gradient(135deg, rgba(37,0,76,0.88) 0%, rgba(12,0,60,0.9) 45%, rgba(5,5,6,0.95) 90%)",
                minHeight: { xs: 320, md: 420 },
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "center",
                justifyContent: "space-between",
                px: { xs: 4, md: 6 },
                py: { xs: 6, md: 0 },
                gap: { xs: 4, md: 6 },
                borderRadius: 4,
                boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
                transition: "transform 0.45s ease, box-shadow 0.45s ease",
                transformOrigin: "center",
                willChange: "transform",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: "0 28px 55px rgba(0,0,0,0.45)",
                },
              }}
            >
              <Stack spacing={2.5} sx={{ maxWidth: 420 }}>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  Experiencia profesional
                </Typography>
                <Typography color="text.secondary">
                  Más de 100 certificaciones en excelencia de hardware respaldan cada
                  reparación y diagnóstico especializado.
                </Typography>
                <Typography color="text.secondary">
                  Acompañamiento personalizado, seguimiento continuo y garantías
                  extendidas para tu tranquilidad.
                </Typography>
                <Link href={scheduleHref} passHref legacyBehavior>
                  <Button component="a" variant="contained" color="secondary" size="large">
                    Agenda una cita
                  </Button>
                </Link>
              </Stack>

              <Box sx={{ position: "relative", width: { xs: 200, md: 240 }, height: { xs: 200, md: 240 } }}>
                <Image
                  src="/services/hardware/certified.png"
                  alt="Sello de certificación profesional"
                  fill
                  sizes="180px"
                  style={{ objectFit: "contain" }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <WhatsAppFab phone={whatsappNumber} />
    </>
  );
}
