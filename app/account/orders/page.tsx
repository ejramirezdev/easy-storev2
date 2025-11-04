import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Link as MuiLink, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import OrderHistoryItem from "@/components/account/OrderHistoryItem";

export default async function AccountOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/account/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              imageUrl: true,
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1,
                select: { url: true },
              },
            },
          },
          service: { select: { name: true } },
        },
      },
      addresses: true,
    },
  });

  // Serializar los datos para pasar a Client Components (convertir Decimal a number)
  const serializedOrders = orders.map((order) => ({
    id: order.id,
    status: order.status,
    total: Number(order.total), // Convertir Decimal a number
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice), // Convertir Decimal a number
      product: item.product,
      service: item.service,
    })),
    addresses: order.addresses,
  }));

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "rgba(255,255,255,0.02)",
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={700}>
            Historial de compras
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta el detalle de tus pedidos y realiza seguimiento a cada
            compra.
          </Typography>
        </Stack>

        {orders.length === 0 ? (
          <Stack spacing={2} alignItems="center" textAlign="center" py={4}>
            <Typography variant="h6" fontWeight={700}>
              Aún no tienes compras registradas
            </Typography>
            <Typography color="text.secondary">
              Explora nuestro catálogo y realiza tu primera compra.
            </Typography>
            <Link href="/products" legacyBehavior passHref>
              <MuiLink underline="none" color="secondary" fontWeight={600}>
                Ver productos
              </MuiLink>
            </Link>
          </Stack>
        ) : (
          serializedOrders.map((order) => (
            <OrderHistoryItem key={order.id} order={order} />
          ))
        )}
      </Stack>
    </Paper>
  );
}
