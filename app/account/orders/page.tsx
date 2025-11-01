import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import {
  Box,
  Chip,
  Divider,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

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
          product: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
      addresses: true,
    },
  });

  if (orders.length === 0) {
    return (
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography variant="h6" fontWeight={700}>
          Aún no tienes compras registradas
        </Typography>
        <Typography color="text.secondary">
          Explora nuestro catálogo y realiza tu primera compra.
        </Typography>
        <MuiLink component={Link} href="/products" underline="none" color="secondary">
          Ver productos
        </MuiLink>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {orders.map((order) => {
        const subtotal = order.subtotal
          ? Number(order.subtotal)
          : order.items.reduce(
              (acc, it) => acc + Number(it.unitPrice) * it.quantity,
              0
            );
        const discount = order.discountTotal ? Number(order.discountTotal) : 0;
        const shipping = order.shippingTotal ? Number(order.shippingTotal) : 0;
        const total = order.total ? Number(order.total) : subtotal - discount + shipping;
        const shippingAddress = order.addresses.find((addr) => addr.type === "SHIPPING");

        return (
          <Stack
            key={order.id}
            spacing={2}
            sx={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 2,
              p: 2,
              bgcolor: "rgba(255,255,255,0.02)",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between">
              <Stack spacing={0.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Orden #{order.id.slice(0, 8).toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.createdAt.toLocaleString()}
                </Typography>
              </Stack>
              <Chip
                label={order.status}
                color={order.status === "COMPLETED" ? "success" : "default"}
                variant="outlined"
              />
            </Stack>

            <Stack spacing={0.5}>
              {order.items.map((item) => {
                const label = item.product?.name ?? item.service?.name ?? "Producto";
                return (
                  <Typography key={item.id} variant="body2">
                    {label} × {item.quantity}
                  </Typography>
                );
              })}
            </Stack>

            <Divider />

            <Stack spacing={0.5}>
              <Typography variant="body2">
                Subtotal: ${subtotal.toFixed(2)}
              </Typography>
              {discount > 0 && (
                <Typography variant="body2">Descuento: -${discount.toFixed(2)}</Typography>
              )}
              {shipping > 0 && (
                <Typography variant="body2">Envío: ${shipping.toFixed(2)}</Typography>
              )}
              <Typography variant="subtitle1" fontWeight={700}>
                Total: ${total.toFixed(2)}
              </Typography>
            </Stack>

            {shippingAddress && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Envío para:
                </Typography>
                <Typography variant="body2">
                  {shippingAddress.firstName} {shippingAddress.lastName} - {shippingAddress.city}
                </Typography>
              </Box>
            )}

            <Box display="flex" justifyContent="flex-end">
              <MuiLink component={Link} href={`/orders/${order.id}`} underline="none">
                Ver detalle
              </MuiLink>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}
