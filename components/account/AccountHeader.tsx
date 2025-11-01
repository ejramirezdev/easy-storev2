"use client";

import { Typography } from "@mui/material";
import { useSession } from "next-auth/react";

export default function AccountHeader() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? session?.user?.email ?? "usuario";

  return (
    <Typography variant="h4" fontWeight={800}>
      Hola, {name}
    </Typography>
  );
}
