import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-utils";
import { requiresTwoFactorVerification, verify2FAToken } from "@/lib/admin-2fa-session";
import { prisma } from "@/lib/prisma";
import {
  adminProductInclude,
  toAdminProduct,
} from "@/lib/products/serialization";
import type { AdminCategory, AdminProduct } from "@/lib/products/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import Link from "next/link";
import AdminTabs from "@/components/admin/AdminTabs";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  // Verificar autenticación y permisos admin
  if (!session || !isAdminEmail(email)) {
    redirect("/");
  }

  // Verificar si necesita verificación 2FA
  if (!session.user?.id) {
    redirect("/");
  }

  // Verificar si 2FA está habilitado y requiere verificación
  const needsVerification = await requiresTwoFactorVerification(session.user.id);
  
  // Log para debug (solo en desarrollo)
  if (process.env.NODE_ENV === "development") {
    console.log("[2FA Debug] User ID:", session.user.id);
    console.log("[2FA Debug] Needs verification:", needsVerification);
  }
  
  if (needsVerification) {
    // Verificar si hay un token 2FA válido en la URL
    const params = await searchParams;
    const token = params?.["2fa_token"] as string | undefined;
    
    if (process.env.NODE_ENV === "development") {
      console.log("[2FA Debug] Token in URL:", !!token);
    }
    
    if (!token || !(await verify2FAToken(token, session.user.id))) {
      // No hay token válido, redirigir a verificación 2FA
      if (process.env.NODE_ENV === "development") {
        console.log("[2FA Debug] Redirecting to 2FA verification");
      }
      const redirectUrl = encodeURIComponent("/admin");
      redirect(`/admin/verify-2fa?redirect=${redirectUrl}`);
    }
    // Token válido, permitir acceso (el token se elimina automáticamente después de usarse)
    if (process.env.NODE_ENV === "development") {
      console.log("[2FA Debug] Token verified, allowing access");
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log("[2FA Debug] 2FA not enabled, allowing access without verification");
    }
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: adminProductInclude,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const formatted: AdminProduct[] = products.map(toAdminProduct);
  const formattedCategories: AdminCategory[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" fontWeight={900} gutterBottom>
                Panel de administración
              </Typography>
              <Typography color="text.secondary">
                Hola {session.user?.name ?? email ?? "Administrador"}, gestiona
                productos, categorías, órdenes y configuración de pagos.
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Link href="/admin/2fa" legacyBehavior passHref>
                <Button component="a" variant="outlined">
                  Configurar 2FA
                </Button>
              </Link>
              <Link href="/" legacyBehavior passHref>
                <Button component="a" variant="outlined" color="secondary">
                  Volver a la tienda
                </Button>
              </Link>
            </Stack>
          </Stack>
        </Box>

        <AdminTabs
          products={formatted}
          categories={formattedCategories}
          adminName={session.user?.name ?? email ?? "Administrador"}
        />
      </Stack>
    </Container>
  );
}
