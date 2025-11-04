import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  Box,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import OrderPaymentSection from "@/components/orders/OrderPaymentSection";
import { PayboxAddress, PayboxConfig } from "@/components/orders/PayboxButton";
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
  const shipping = 0; // El envío se puede agregar en el futuro
  const total = order.total
    ? Number(order.total)
    : subtotal - discount + shipping;

  const payboxBillingAddress = billingAddress
    ? mapAddressToPaybox(billingAddress)
    : null;
  const payboxShippingAddress = shippingAddress
    ? mapAddressToPaybox(shippingAddress)
    : null;

  const payboxConfig = await resolvePayboxConfig();

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
              payboxConfig={payboxConfig}
              totals={{
                subtotal,
                discount,
                shipping,
                total,
                currency: payboxConfig.currency,
              }}
              billingAddress={payboxBillingAddress}
              shippingAddress={payboxShippingAddress}
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

async function resolvePayboxConfig(): Promise<PayboxConfig> {
  const rawEnv =
    process.env.PAYBOX_ENVIRONMENT ??
    process.env.NEXT_PUBLIC_PAYBOX_ENV ??
    "sandbox";
  const normalizedEnv =
    rawEnv.toLowerCase() === "production" ? "production" : "sandbox";

  const scriptUrls: Partial<Record<"sandbox" | "production", string>> = {};
  if (process.env.PAYBOX_SANDBOX_SCRIPT_URL) {
    scriptUrls.sandbox = process.env.PAYBOX_SANDBOX_SCRIPT_URL;
  }
  if (process.env.PAYBOX_PRODUCTION_SCRIPT_URL) {
    scriptUrls.production = process.env.PAYBOX_PRODUCTION_SCRIPT_URL;
  }

  const extras: Record<string, unknown> = {
    channel: "order-detail",
  };
  if (process.env.PAYBOX_BUTTON_ID) {
    extras.buttonId = process.env.PAYBOX_BUTTON_ID;
  }
  if (process.env.PAYBOX_RESPONSE_URL) {
    extras.responseUrl = process.env.PAYBOX_RESPONSE_URL;
  }
  if (process.env.PAYBOX_CONFIRMATION_URL) {
    extras.confirmationUrl = process.env.PAYBOX_CONFIRMATION_URL;
  }
  // Banderas desde variables de entorno (fallback)
  if (process.env.PAYBOX_ONLY_CREDIT) {
    extras.onlyCredit = process.env.PAYBOX_ONLY_CREDIT === "true";
  }
  if (process.env.PAYBOX_ONLY_DEBIT) {
    extras.onlyDebit = process.env.PAYBOX_ONLY_DEBIT === "true";
  }
  if (process.env.PAYBOX_BLOCK_DEFERRED) {
    extras.permitirBloquearDiferimientos =
      process.env.PAYBOX_BLOCK_DEFERRED === "true";
  }
  if (process.env.PAYBOX_EXTRA_FIELDS) {
    extras.permitirDatosAdicionales =
      process.env.PAYBOX_EXTRA_FIELDS === "true";
  }
  if (process.env.PAYBOX_RECURRENT) {
    extras.recurrent = process.env.PAYBOX_RECURRENT === "true";
  }

  // Fusionar con configuración administrable (si existe)
  const db = await prisma.payboxSettings.findFirst();
  if (db) {
    extras.onlyCredit = db.onlyCredit;
    extras.onlyDebit = db.onlyDebit;
    extras.permitirBloquearDiferimientos = db.blockDeferred;
    extras.permitirDatosAdicionales = db.extraFields;
    extras.recurrent = db.recurrentEnabled;
    extras.planId = db.planId ?? undefined;
    extras.frequency = db.frequency ?? undefined;
    extras.amountVariable = db.amountVariable;
    if (db.responseUrl) extras.responseUrl = db.responseUrl;
    if (db.confirmationUrl) extras.confirmationUrl = db.confirmationUrl;
  }

  return {
    environment: (db?.environment as any) || normalizedEnv,
    publicKey: process.env.PAYBOX_PUBLIC_KEY ?? null,
    merchantId: process.env.PAYBOX_MERCHANT_ID ?? null,
    merchantName: db?.merchantName ?? process.env.PAYBOX_MERCHANT_NAME ?? null,
    merchantEmail: db?.merchantEmail ?? process.env.PAYBOX_MERCHANT_EMAIL ?? "",
    scriptUrls: Object.keys(scriptUrls).length > 0 ? scriptUrls : undefined,
    currency: process.env.PAYBOX_CURRENCY ?? "USD",
    extras,
    flags: {
      autoReturn: (process.env.PAYBOX_AUTO_RETURN ?? "true") !== "false",
      generateInvoice: process.env.PAYBOX_GENERATE_INVOICE === "true",
      sendMail: (process.env.PAYBOX_SEND_MAIL ?? "true") !== "false",
      showReceipt: process.env.PAYBOX_SHOW_RECEIPT === "true",
    },
  };
}

function mapAddressToPaybox(address: any): PayboxAddress {
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
