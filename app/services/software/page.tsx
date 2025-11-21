import WhatsAppFab from "@/components/home/WhatsAppFab";
import { Box, Button, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

const whatsappNumber = "+593958720950";
const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`;
const quoteHref = "/services/software/quote";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easy-storev2.vercel.app";

export const metadata: Metadata = {
  title: "Desarrollo de Software a Medida",
  description:
    "Desarrollo de software a medida en Ecuador con tecnologías de punta, seguridad avanzada, aplicaciones web y bases de datos. Transformamos tu idea en realidad digital.",
  keywords: [
    "desarrollo software Ecuador",
    "software a medida Ecuador",
    "aplicaciones web Ecuador",
    "desarrollo web Ecuador",
    "programación Ecuador",
    "sistemas empresariales Ecuador",
  ],
  openGraph: {
    title: "Desarrollo de Software a Medida | Easy Store",
    description: "Desarrollo de software a medida con tecnologías modernas, seguridad avanzada y arquitecturas escalables en Ecuador.",
    url: `${siteUrl}/services/software`,
  },
  alternates: {
    canonical: `${siteUrl}/services/software`,
  },
};

export default function SoftwareServicesPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Desarrollo de Software",
    "name": "Desarrollo de Software a Medida",
    "description": "Desarrollo de software a medida en Ecuador con tecnologías de punta, seguridad avanzada, aplicaciones web y bases de datos. Transformamos tu idea en realidad digital.",
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
          {/* Hero Section */}
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
                  maxWidth: 600,
                  lineHeight: 1.05,
                }}
              >
                Desarrollamos tu software a medida
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: 600 }}
              >
                Convierte tu idea en una realidad digital. Creamos aplicaciones
                web, sistemas empresariales y soluciones personalizadas con las
                últimas tecnologías. Diseños modernos, rendimiento óptimo y
                total compatibilidad con cualquier dispositivo.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ pt: 2 }}
              >
                <Link href={quoteHref} style={{ textDecoration: "none" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                  >
                    Cotiza tu proyecto
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
                src="/services/software/laptop-coding.png"
                alt="Desarrollo de software a medida"
                fill
                priority
                sizes="(min-width: 1200px) 480px, (min-width: 900px) 400px, 80vw"
                style={{ objectFit: "contain" }}
              />
            </Box>
          </Box>

          {/* Services Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 6, md: 4 },
            }}
          >
            {/* Tecnologías de punta */}
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
                  Tecnologías de punta
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 380 }}>
                  Utilizamos las últimas tecnologías y frameworks modernos para
                  garantizar que tu software esté a la vanguardia del mercado.
                  Desarrollo ágil, escalable y mantenible.
                </Typography>
                <Stack spacing={1} sx={{ pt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    • Frameworks modernos (React, Next.js, Node.js)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Arquitecturas cloud-native
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • APIs RESTful y GraphQL
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Seguridad y Calidad */}
            <Box
              sx={{
                background:
                  "linear-gradient(135deg, rgba(37,0,76,0.88) 0%, rgba(12,0,60,0.9) 45%, rgba(5,5,6,0.95) 90%)",
                minHeight: { xs: 320, md: 420 },
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
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
                  Seguridad avanzada
                </Typography>
                <Typography color="text.secondary">
                  Implementamos las mejores prácticas de seguridad para proteger
                  tu información y la de tus usuarios. Certificaciones,
                  auditorías y cumplimiento de estándares internacionales.
                </Typography>
                <Stack spacing={1} sx={{ pt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    • Encriptación de datos en tránsito y reposo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Autenticación y autorización robusta
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Protección contra vulnerabilidades comunes
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {/* Desarrollo Web */}
            <Box
              sx={{
                background:
                  "linear-gradient(135deg, rgba(37,0,76,0.88) 0%, rgba(12,0,60,0.9) 45%, rgba(5,5,6,0.95) 90%)",
                minHeight: { xs: 320, md: 420 },
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
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
                  Desarrollo Web
                </Typography>
                <Typography color="text.secondary">
                  Aplicaciones web responsivas y de alto rendimiento. Desde
                  landing pages hasta plataformas complejas, diseñamos y
                  desarrollamos soluciones que se adaptan a tus necesidades.
                </Typography>
                <Stack spacing={1} sx={{ pt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    • Aplicaciones web progresivas (PWA)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Diseño responsive y mobile-first
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Optimización de rendimiento y SEO
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {/* Bases de Datos */}
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
                  Bases de Datos
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 380 }}>
                  Diseño e implementación de arquitecturas de datos robustas y
                  escalables. Optimización de consultas, backups automáticos y
                  alta disponibilidad.
                </Typography>
                <Stack spacing={1} sx={{ pt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    • Bases de datos relacionales y NoSQL
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Optimización y indexación
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Replicación y alta disponibilidad
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Box>

          {/* CTA Section */}
          <Box
            sx={{
              background:
                "linear-gradient(135deg, rgba(113,0,150,0.68) 0%, rgba(16,0,50,0.9) 55%, rgba(5,5,6,0.95) 100%)",
              px: { xs: 4, md: 6 },
              py: { xs: 6, md: 8 },
              borderRadius: 4,
              boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
              textAlign: "center",
            }}
          >
            <Stack spacing={3} alignItems="center">
              <Typography variant="h3" sx={{ fontWeight: 800, maxWidth: 700 }}>
                Danos tu idea y la haremos realidad
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: 600 }}
              >
                Estamos listos para convertir tu visión en una solución digital
                que impulse tu negocio. Contáctanos y comencemos a trabajar
                juntos.
              </Typography>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ pt: 2 }}
              >
                <Link href={quoteHref} style={{ textDecoration: "none" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                  >
                    Cotiza tu proyecto
                  </Button>
                </Link>
                <Button
                  component="a"
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  color="secondary"
                  size="large"
                  sx={{ borderWidth: 2 }}
                >
                  Contáctame
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>

      <WhatsAppFab phone={whatsappNumber} />
    </>
  );
}
