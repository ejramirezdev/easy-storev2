import WhatsAppFab from "@/components/home/WhatsAppFab";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

const contactHref = "mailto:hola@easy-store.dev";

export const metadata = {
  title: "Servicios de software | Easy Store",
  description:
    "Desarrollo, mantenimiento y consultoría de software personalizado para potenciar tu negocio.",
};

export default function SoftwareServicesPlaceholder() {
  return (
    <>
      <Box
        component="main"
        sx={{
          bgcolor: "#050506",
          color: "text.primary",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Container maxWidth="md" sx={{ py: { xs: 12, md: 16 } }}>
          <Stack spacing={3}>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              Servicios de software
            </Typography>
            <Typography color="text.secondary">
              Estamos terminando de preparar toda la información sobre nuestros
              servicios de desarrollo, automatización e integración. Muy pronto
              podrás solicitar tu proyecto desde aquí.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Link href="/services/hardware" passHref legacyBehavior>
                <Button component="a" variant="outlined" color="secondary">
                  Ver servicios de hardware
                </Button>
              </Link>
              <Button component="a" href={contactHref} variant="contained" color="primary">
                Escríbenos por email
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
      <WhatsAppFab />
    </>
  );
}
