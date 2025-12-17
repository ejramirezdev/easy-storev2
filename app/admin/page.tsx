import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-utils";
import { requiresTwoFactorVerification } from "@/lib/admin-2fa-session";
import { prisma } from "@/lib/prisma";
import {
  adminProductInclude,
  toAdminProduct,
} from "@/lib/products/serialization";
import type { AdminCategory, AdminProduct } from "@/lib/products/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

  // Obtener token de sesión 2FA desde la cookie
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_2fa_session")?.value || null;

  // Verificar si 2FA está habilitado y requiere verificación
  const needsVerification = await requiresTwoFactorVerification(session.user.id, sessionToken);
  
  // Log para debug (solo en desarrollo)
  if (process.env.NODE_ENV === "development") {
    console.log("[2FA Debug] User ID:", session.user.id);
    console.log("[2FA Debug] Has session token:", !!sessionToken);
    console.log("[2FA Debug] Needs verification:", needsVerification);
  }
  
  if (needsVerification) {
    // No hay sesión 2FA válida, redirigir a verificación
    if (process.env.NODE_ENV === "development") {
      console.log("[2FA Debug] Redirecting to 2FA verification");
    }
    const redirectUrl = encodeURIComponent("/admin");
    redirect(`/admin/verify-2fa?redirect=${redirectUrl}`);
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log("[2FA Debug] 2FA session valid or not enabled, allowing access");
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
