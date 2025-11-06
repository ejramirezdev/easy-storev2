import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  Alert,
  Box,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import OrderPaymentSection from "@/components/orders/OrderPaymentSection";
import { PayphoneAddress, PayphoneConfig } from "@/components/orders/PayphoneButton";
type PageProps = { 
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrderDetailPage({ 
  params,
  searchParams,
}: PageProps) {
  noStore();

  const { id } = await params;
  const orderId = id?.trim();

  if (!orderId) return notFound();

  // Capturar parámetros de la URL para mostrar mensajes
  const resolvedSearchParams = await searchParams;
  const paymentStatus = resolvedSearchParams?.payment as string | undefined;
  const error = resolvedSearchParams?.error as string | undefined;
  const warning = resolvedSearchParams?.warning as string | undefined;

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

  const shippingAddress = order.addresses.find(
    (it: any) => it.type === "SHIPPING"
  );
  const billingAddress = order.addresses.find(
    (it: any) => it.type === "BILLING"
  );

  // Totales (calcular desde los items si no están almacenados)
  const subtotal = order.items.reduce(
    (acc, it) => acc + Number(it.unitPrice) * it.quantity,
    0
  );
  const discount = 0; // Los descuentos se pueden agregar en el futuro
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  // El precio ya incluye IVA, calculamos el impuesto internamente
  const basePrice = Math.round((subtotalAfterDiscount / 1.15) * 100) / 100; // Precio base sin IVA
  const tax = Math.round((subtotalAfterDiscount - basePrice) * 100) / 100; // Impuesto incluido en el precio
  const shipping = 0; // El envío se puede agregar en el futuro
  // Total NO incluye tax adicional porque ya está en el subtotal
  const total = order.total
    ? Number(order.total)
    : subtotal - discount + shipping;

  const payphoneBillingAddress = billingAddress
    ? mapAddressToPayphone(billingAddress)
    : null;
  const payphoneShippingAddress = shippingAddress
    ? mapAddressToPayphone(shippingAddress)
    : null;

  const payphoneConfig = await resolvePayphoneConfig();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Orden #{order.id.slice(0, 8).toUpperCase()}
      </Typography>

      {/* Mostrar mensajes de pago */}
      {paymentStatus === "success" && (
        <Alert severity={warning === "confirmation_api_failed" ? "warning" : "success"} sx={{ mb: 3 }}>
          {warning === "confirmation_api_failed" ? (
            <>
              ✅ Pago confirmado exitosamente. Tu orden está siendo procesada.
              <Typography variant="body2" sx={{ mt: 1, fontSize: "0.875rem" }}>
                Nota: Hubo un problema técnico al confirmar con la API de Payphone, pero tu pago fue procesado correctamente. Payphone nos redirigió al callback, lo que confirma que el pago fue exitoso.
              </Typography>
            </>
          ) : (
            "✅ Pago confirmado exitosamente. Tu orden está siendo procesada."
          )}
        </Alert>
      )}
      {paymentStatus === "already_paid" && (
        <Alert severity="info" sx={{ mb: 3 }}>
          ℹ️ Esta orden ya fue pagada anteriormente.
        </Alert>
      )}
      {warning === "confirmation_pending" && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ El pago fue procesado, pero estamos verificando la confirmación. 
          Si recibiste el email de confirmación de Payphone, tu pago está siendo procesado.
          {error && (
            <Typography variant="body2" sx={{ mt: 1, fontSize: "0.875rem" }}>
              Detalles: {decodeURIComponent(error)}
            </Typography>
          )}
        </Alert>
      )}
      {error && error !== "order_not_pending" && warning !== "confirmation_pending" && (
        <Alert 
          severity={resolvedSearchParams?.critical === "true" ? "error" : "error"} 
          sx={{ mb: 3 }}
        >
          {error === "confirmation_failed" && resolvedSearchParams?.critical === "true" ? (
            <>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                ⚠️ PROBLEMA CRÍTICO: No se pudo confirmar el pago con Payphone
              </Typography>
              {resolvedSearchParams?.message && (
                <Typography variant="body2" sx={{ mt: 1, fontSize: "0.875rem" }}>
                  {decodeURIComponent(resolvedSearchParams.message as string)}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mt: 2, fontSize: "0.875rem", fontWeight: 700, color: "error.main" }}>
                ⚠️ IMPORTANTE: Si no se confirma en 5 minutos, Payphone reversará automáticamente la transacción.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontSize: "0.875rem" }}>
                El pago fue procesado por Payphone, pero no se pudo confirmar en nuestro sistema.
                La orden NO ha sido marcada como pagada y el stock NO ha sido restado.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontSize: "0.875rem", fontWeight: 600 }}>
                Por favor, contacta con soporte INMEDIATAMENTE para resolver este problema.
              </Typography>
            </>
          ) : error === "confirmation_failed" ? (
            <>
              No se pudo confirmar la transacción con Payphone.
              {resolvedSearchParams?.message && (
                <Typography variant="body2" sx={{ mt: 1, fontSize: "0.875rem" }}>
                  {decodeURIComponent(resolvedSearchParams.message as string)}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mt: 1, fontSize: "0.875rem", fontWeight: 600 }}>
                ⚠️ Importante: Si no se confirma en 5 minutos, Payphone reversará automáticamente la transacción.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontSize: "0.875rem" }}>
                Por favor, contacta con soporte para verificar el estado del pago.
              </Typography>
            </>
          ) : error === "payment_not_approved"
          ? "El pago no fue aprobado. Por favor, intenta con otro método de pago."
          : decodeURIComponent(error)}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estado
            </Typography>
            <Typography variant="body1">Pago: {order.status}</Typography>
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
              {/* Impuesto oculto - ya está incluido en el precio */}
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
            <OrderPaymentSection
              orderId={order.id}
              status={order.status}
              total={total}
              currentPaymentMethod={
                (order as any).paymentMethod as "CARD" | "BANK_TRANSFER" | null
              }
              currentBank={(order as any).selectedBank}
              receiptUrl={(order as any).receiptUrl}
              payphoneConfig={payphoneConfig}
              totals={{
                subtotal,
                discount,
                tax,
                shipping,
                total,
                currency: payphoneConfig.currency || "USD",
              }}
              billingAddress={payphoneBillingAddress}
              shippingAddress={payphoneShippingAddress}
            />
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
  const line2 =
    address.line2 ?? (remainingStreet.length > 0 ? remainingStreet : undefined);

  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">
        {address.firstName} {address.lastName}
      </Typography>
      <Typography variant="body2">{address.email}</Typography>
      {address.phone && (
        <Typography variant="body2">{address.phone}</Typography>
      )}
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

async function resolvePayphoneConfig(): Promise<PayphoneConfig> {
  // Obtener configuración de la base de datos
  const db = await prisma.payphoneSettings.findFirst();
  
  // Determinar entorno
  const rawEnv = db?.environment || process.env.PAYPHONE_ENVIRONMENT || "sandbox";
  const environment = rawEnv.toLowerCase() === "production" ? "production" : "sandbox";

  // Obtener credenciales (de DB o variables de entorno como fallback)
  const token = db?.token || process.env.PAYPHONE_TOKEN || "";
  const storeId = db?.storeId || process.env.PAYPHONE_STORE_ID || "";

  // URL de respuesta
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const responseUrl = db?.responseUrl || process.env.PAYPHONE_RESPONSE_URL || `${baseUrl}/api/payphone/callback`;

  return {
    environment: environment as "sandbox" | "production",
    token,
    storeId,
    merchantName: db?.merchantName || process.env.PAYPHONE_MERCHANT_NAME || null,
    merchantEmail: db?.merchantEmail || process.env.PAYPHONE_MERCHANT_EMAIL || null,
    responseUrl,
    currency: process.env.PAYPHONE_CURRENCY || "USD",
  };
}

function mapAddressToPayphone(address: any): PayphoneAddress {
  const streetLines = Array.isArray(address.street)
    ? address.street
    : typeof address.street === "string"
    ? address.street.split("\n")
    : [];
  const [firstLine = "", ...rest] = streetLines;
  const line2 = rest.join(" ").trim();
  const normalizedPhone =
    typeof address.phone === "string" && address.phone.trim().length === 0
      ? null
      : address.phone ?? null;

  const normalizedState =
    typeof address.state === "string" && address.state.trim().length === 0
      ? null
      : address.state ?? null;

  const normalizedLine1 =
    typeof address.line1 === "string" && address.line1.trim().length > 0
      ? address.line1
      : firstLine || (typeof address.street === "string" ? address.street : "");

  return {
    firstName: address.firstName ?? "",
    lastName: address.lastName ?? "",
    email: address.email ?? "",
    phone: normalizedPhone,
    documentType: address.documentType ?? null,
    document:
      typeof address.document === "string" && address.document.trim().length > 0
        ? address.document
        : null,
    line1: normalizedLine1,
    line2:
      (address.line2 as string | undefined) ??
      (line2.length > 0 ? line2 : null),
    city: address.city ?? "",
    state: normalizedState,
    postalCode: address.postalCode ?? null,
    country: address.country ?? "EC",
  };
}
