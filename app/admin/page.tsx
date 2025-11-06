import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
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

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!session || !isAdminEmail(email)) {
    redirect("/");
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

            <Link href="/" legacyBehavior passHref>
              <Button component="a" variant="outlined" color="secondary">
                Volver a la tienda
              </Button>
            </Link>
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
