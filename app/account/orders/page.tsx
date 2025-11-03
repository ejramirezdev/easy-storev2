import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Box, Chip, Divider, Link as MuiLink, Paper, Stack, Typography } from "@mui/material";
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
            Consulta el detalle de tus pedidos y realiza seguimiento a cada compra.
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
          orders.map((order) => {
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
            const paymentStatus = (order.paymentStatus ?? "PENDING") as string;
            const paymentError = extractPaymentError(order.paymentPayload);

            return (
              <Stack
                key={order.id}
                spacing={2}
                sx={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2,
                  p: { xs: 2, md: 2.5 },
                  bgcolor: "rgba(0,0,0,0.15)",
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Orden #{order.id.slice(0, 8).toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.createdAt.toLocaleString()}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
                  >
                    <Chip
                      label={order.status}
                      color={order.status === "COMPLETED" || order.status === "PAID" ? "success" : "default"}
                      variant="outlined"
                    />
                    <Chip
                      label={paymentStatusLabel(paymentStatus)}
                      color={
                        paymentStatus === "PAID"
                          ? "success"
                          : paymentStatus === "FAILED"
                          ? "error"
                          : "default"
                      }
                      variant="outlined"
                    />
                  </Stack>
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

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Stack spacing={0.5}>
                  <Typography variant="body2">Subtotal: ${subtotal.toFixed(2)}</Typography>
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

                {paymentError && (
                  <Typography variant="body2" color="error">
                    Pago rechazado: {paymentError}
                  </Typography>
                )}

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
                  <Link href={`/orders/${order.id}`} legacyBehavior passHref>
                    <MuiLink underline="none" color="secondary" fontWeight={600}>
                      Ver detalle
                    </MuiLink>
                  </Link>
                </Box>
              </Stack>
            );
          })
        )}
      </Stack>
    </Paper>
  );
}

function paymentStatusLabel(status: string) {
  switch (status) {
    case "PAID":
      return "Pagado";
    case "FAILED":
      return "Pago fallido";
    case "REQUIRES_ACTION":
      return "Pago requiere acción";
    default:
      return "Pago pendiente";
  }
}

function extractPaymentError(payload: any): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  if ("errorMessage" in payload && payload.errorMessage) return String(payload.errorMessage);
  if ("message" in payload && payload.message) return String(payload.message);
  if ("error" in payload && payload.error) return String(payload.error);
  return undefined;
}
