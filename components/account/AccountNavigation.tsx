"use client";

import { Tabs, Tab } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { label: "Perfil", href: "/account/profile" },
  { label: "Historial de compras", href: "/account/orders" },
  { label: "Favoritos", href: "/account/favorites" },
];

export default function AccountNavigation() {
  const pathname = usePathname();
  const current = sections.find((section) => pathname?.startsWith(section.href));
  const value = current?.href ?? sections[0].href;

  return (
    <Tabs
      value={value}
      variant="scrollable"
      scrollButtons="auto"
      textColor="secondary"
      indicatorColor="secondary"
      sx={{
        "& .MuiTab-root": {
          textTransform: "none",
          fontWeight: 600,
        },
      }}
    >
      {sections.map((section) => (
        <Tab
          key={section.href}
          label={section.label}
          value={section.href}
          component={Link}
          href={section.href}
        />
      ))}
    </Tabs>
  );
}
