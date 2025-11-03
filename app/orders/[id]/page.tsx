import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import Grid from "@mui/material/GridLegacy";
type PageProps = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: PageProps) {
  noStore();

  const { id } = await params;
  const orderId = id?.trim();

  if (!orderId) return notFound();

  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id as string | undefined;
  const sessionRole = session?.user?.role as ("CUSTOMER" | "ADMIN") | undefined;

  if (!sessionUserId) {
    const callbackUrl = encodeURIComponent(`/orders/${orderId}`);
    redirect(`/api/auth/signin?callbackUrl=${callbackUrl}`);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { name: true, slug: true, imageUrl: true } },
          service: { select: { name: true } },
        },
      },
      addresses: true,
    },
  });

  if (!order) return notFound();

  if (order.userId !== sessionUserId && sessionRole !== "ADMIN") {
    return notFound();
  }

  const shippingAddress = order.addresses.find((it: any) => it.type === "SHIPPING");
  const billingAddress = order.addresses.find((it: any) => it.type === "BILLING");

  // Totales (soporta snapshot si lo agregaste; si no, usa total)
  const subtotal = order.subtotal
    ? Number(order.subtotal)
    : order.items.reduce(
        (acc, it) => acc + Number(it.unitPrice) * it.quantity,
        0
      );
  const discount = order.discountTotal ? Number(order.discountTotal) : 0;
  const shipping = order.shippingTotal ? Number(order.shippingTotal) : 0;
  const total = order.total
    ? Number(order.total)
    : subtotal - discount + shipping;
  const paymentStatus = (order.paymentStatus ?? "PENDING") as string;
  const paymentError = extractPaymentError(order.paymentPayload);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Orden #{order.id.slice(0, 8).toUpperCase()}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estado
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={`Orden: ${orderStatusLabel(order.status)}`}
                  color={order.status === "PAID" || order.status === "COMPLETED" ? "success" : "default"}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`Pago: ${paymentStatusLabel(paymentStatus)}`}
                  color={
                    paymentStatus === "PAID"
                      ? "success"
                      : paymentStatus === "FAILED"
                      ? "error"
                      : "default"
                  }
                  variant="outlined"
                  size="small"
                />
              </Stack>
              {order.paymentProvider && (
                <Typography variant="body2" color="text.secondary">
                  Proveedor: {order.paymentProvider}
                </Typography>
              )}
              {paymentStatus === "PAID" && order.paidAt && (
                <Typography variant="body2" color="text.secondary">
                  Pagado el {order.paidAt.toLocaleString()}
                </Typography>
              )}
              {paymentError && (
                <Typography variant="body2" color="error">
                  Error de pago: {paymentError}
                </Typography>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Artículos
            </Typography>
            <Stack spacing={1}>
              {order.items.map((it) => {
                const itemName =
                  it.product?.name ?? it.service?.name ?? "Producto";

                return (
                  <Stack
                    key={it.id}
                    direction="row"
                    justifyContent="space-between"
                  >
                  <Typography>
                    {itemName} × {it.quantity}
                  </Typography>
                  <Typography>
                    ${(Number(it.unitPrice) * it.quantity).toFixed(2)}
                  </Typography>
                </Stack>
                );
              })}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={0.5}>
              <Row label="Subtotal" value={subtotal} />
              {discount > 0 && <Row label="Descuento" value={-discount} />}
              {shipping > 0 && <Row label="Envío" value={shipping} />}
              <Divider sx={{ my: 1 }} />
              <Row label="Total" value={total} strong />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Envío
            </Typography>
            <AddressBlock address={shippingAddress} />
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Facturación
            </Typography>
            <AddressBlock address={billingAddress} />
          </Paper>

          <Box mt={2}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Button variant="contained" fullWidth disabled>
                Pago en línea disponible próximamente
              </Button>
            </Link>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

type AddressProps = {
  address: any;
};

function AddressBlock({ address }: AddressProps) {
  if (!address) return <Typography variant="body2">-</Typography>;

  const streetLines = Array.isArray(address.street)
    ? address.street
    : typeof address.street === "string"
    ? address.street.split("\n")
    : [];
  const line1 = address.line1 ?? streetLines[0];
  const remainingStreet = streetLines.slice(1).join(" ").trim();
  const line2 = address.line2 ?? (remainingStreet.length > 0 ? remainingStreet : undefined);

  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">
        {address.firstName} {address.lastName}
      </Typography>
      <Typography variant="body2">{address.email}</Typography>
      {address.phone && <Typography variant="body2">{address.phone}</Typography>}
      {line1 && <Typography variant="body2">{line1}</Typography>}
      {line2 && <Typography variant="body2">{line2}</Typography>}
      <Typography variant="body2">
        {address.city}
        {address.state ? `, ${address.state}` : ""}
        {address.postalCode ? `, ${address.postalCode}` : ""}
      </Typography>
      <Typography variant="body2">{address.country}</Typography>
    </Stack>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography
        variant={strong ? "subtitle1" : "body2"}
        fontWeight={strong ? 700 : 400}
      >
        {label}
      </Typography>
      <Typography
        variant={strong ? "subtitle1" : "body2"}
        fontWeight={strong ? 700 : 400}
      >
        ${value.toFixed(2)}
      </Typography>
    </Stack>
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

function orderStatusLabel(status: string) {
  switch (status) {
    case "PAID":
      return "Pagado";
    case "SHIPPED":
      return "Enviado";
    case "COMPLETED":
      return "Completado";
    case "CANCELED":
      return "Cancelado";
    default:
      return "Pendiente";
  }
}

function extractPaymentError(payload: any): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  if ("errorMessage" in payload && payload.errorMessage) return String(payload.errorMessage);
  if ("message" in payload && payload.message) return String(payload.message);
  if ("error" in payload && payload.error) return String(payload.error);
  return undefined;
}
