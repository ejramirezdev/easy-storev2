import { Box, Container, Typography } from "@mui/material";

export const metadata = {
  title: "Agenda tu cita de hardware | Easy Store",
};

export default function HardwareSchedulePlaceholder() {
  return (
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
      <Container maxWidth="sm" sx={{ py: { xs: 12, md: 16 } }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          Agenda tu cita
        </Typography>
        <Typography color="text.secondary">
          Muy pronto podrás reservar una cita en línea para coordinar el servicio
          de hardware. Estamos preparando el formulario para ti.
        </Typography>
      </Container>
    </Box>
  );
}
