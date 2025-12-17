import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import WhatsAppFab from "@/components/home/WhatsAppFab";
import { generateFAQSchema } from "@/lib/structured-data";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes (FAQ)",
  description: "Encuentra respuestas a las preguntas más frecuentes sobre Easy Store, nuestros productos tecnológicos, servicios, envíos y formas de pago en Ecuador.",
  keywords: [
    "FAQ Easy Store",
    "preguntas frecuentes Ecuador",
    "ayuda tienda tecnología",
    "información productos Ecuador",
    "envíos Ecuador",
    "formas de pago Ecuador",
  ],
  openGraph: {
    title: "Preguntas Frecuentes | Easy Store",
    description: "Resuelve tus dudas sobre productos tecnológicos, servicios y envíos en Ecuador.",
    url: `${siteUrl}/faq`,
  },
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
};

const faqs = [
  {
    question: "¿Qué tipo de productos ofrecen en Easy Store?",
    answer: "Ofrecemos una amplia variedad de productos tecnológicos incluyendo gadgets, dispositivos electrónicos, accesorios para computadoras y equipos, y equipos de última generación. Todos nuestros productos son de alta calidad y están disponibles para entrega en todo Ecuador.",
  },
  {
    question: "¿Realizan envíos a toda Ecuador?",
    answer: "Sí, realizamos envíos a nivel nacional en todo Ecuador. El tiempo de entrega varía según la ubicación, pero generalmente entregamos en 2-5 días hábiles en las principales ciudades y 5-10 días en zonas más alejadas.",
  },
  {
    question: "¿Qué formas de pago aceptan?",
    answer: "Aceptamos múltiples formas de pago: tarjetas de crédito/débito a través de Payphone, transferencias bancarias y pago en efectivo contra entrega (disponible en ciertas zonas).",
  },
  {
    question: "¿Ofrecen garantía en sus productos?",
    answer: "Sí, todos nuestros productos incluyen garantía. La duración varía según el fabricante y el tipo de producto, pero generalmente ofrecemos de 3 meses a 1 año de garantía contra defectos de fabricación.",
  },
  {
    question: "¿Qué servicios de reparación ofrecen?",
    answer: "Ofrecemos servicios profesionales de diagnóstico, reparación y mantenimiento de equipos informáticos incluyendo laptops, computadoras de escritorio, y otros dispositivos electrónicos. Nuestros técnicos están altamente capacitados y utilizamos componentes de calidad.",
  },
  {
    question: "¿Desarrollan software a medida?",
    answer: "Sí, contamos con un equipo de desarrolladores expertos que pueden crear soluciones de software personalizadas para tu negocio, incluyendo aplicaciones web, sistemas empresariales, e-commerce y más. Contáctanos para una cotización personalizada.",
  },
  {
    question: "¿Puedo devolver un producto si no me gusta?",
    answer: "Sí, ofrecemos devoluciones dentro de los primeros 7 días de recibido el producto, siempre que esté en su empaque original, sin uso y con todos sus accesorios. El cliente cubre los costos de envío de la devolución.",
  },
  {
    question: "¿Cómo puedo rastrear mi pedido?",
    answer: "Una vez que tu pedido sea despachado, recibirás un número de seguimiento vía email o WhatsApp. Puedes usar este número para rastrear tu pedido en nuestra sección de seguimiento o directamente en el sitio web de la empresa de courier.",
  },
  {
    question: "¿Tienen tienda física?",
    answer: "Actualmente operamos principalmente de forma online para ofrecerte mejores precios y disponibilidad. Sin embargo, puedes contactarnos vía WhatsApp o correo electrónico para coordinar una cita si deseas ver algún producto en persona.",
  },
  {
    question: "¿Cómo puedo contactarlos?",
    answer: "Puedes contactarnos a través de WhatsApp al +593958720950, por email a easystoreecu@gmail.com, o usando nuestro formulario de contacto en el sitio web. Respondemos todas las consultas en menos de 24 horas.",
  },
];

export default function FAQPage() {
  const faqSchema = generateFAQSchema(faqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
              Preguntas Frecuentes
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Encuentra respuestas a las preguntas más comunes sobre nuestros productos y servicios
            </Typography>
          </Box>

          <Box sx={{ maxWidth: 900, mx: "auto" }}>
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                sx={{
                  mb: 2,
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "12px !important",
                  "&:before": {
                    display: "none",
                  },
                  "&.Mui-expanded": {
                    background: "rgba(255, 255, 255, 0.08)",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    "& .MuiAccordionSummary-content": {
                      my: 2,
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              ¿No encontraste lo que buscabas?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Estamos aquí para ayudarte. Contáctanos por WhatsApp o email y te responderemos lo antes posible.
            </Typography>
          </Box>
        </Container>
      </Box>
      <WhatsAppFab phone="+593958720950" />
    </>
  );
}

