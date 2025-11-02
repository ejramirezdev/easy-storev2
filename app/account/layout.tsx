import { ReactNode } from "react";
import { Container, Stack, Box } from "@mui/material";
import AccountHeader from "@/components/account/AccountHeader";

export default function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <AccountHeader />
        <Box>{children}</Box>
      </Stack>
    </Container>
  );
}
