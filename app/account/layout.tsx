import { ReactNode } from "react";
import { Container, Stack, Paper } from "@mui/material";
import AccountNavigation from "@/components/account/AccountNavigation";
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
        <Paper sx={{ p: 2 }}>
          <AccountNavigation />
        </Paper>
        <Paper sx={{ p: 3 }}>
          {children}
        </Paper>
      </Stack>
    </Container>
  );
}
