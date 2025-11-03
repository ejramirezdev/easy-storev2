"use client";

import { useCallback, useMemo, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  Alert,
  AlertColor,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Typography,
} from "@mui/material";

const DEFAULT_JQUERY_URL = "https://code.jquery.com/jquery-3.4.1.min.js";
const DEFAULT_SANDBOX_SCRIPT = "https://sandbox-paybox.pagoplux.com/paybox/index.js";
const DEFAULT_PRODUCTION_SCRIPT = "https://paybox.pagoplux.com/paybox/index.js";

type Environment = "sandbox" | "production";

export type PayboxAddress = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  documentType?: string | null;
  document?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country: string;
};

export type PayboxConfig = {
  environment: Environment;
  publicKey?: string | null;
  merchantId?: string | null;
  merchantName?: string | null;
  merchantEmail: string;
  scriptUrls?: Partial<Record<Environment, string>>;
  currency?: string;
  extras?: Record<string, unknown>;
  flags?: {
    autoReturn?: boolean;
    generateInvoice?: boolean;
    sendMail?: boolean;
    showReceipt?: boolean;
  };
};

type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency?: string;
};

export type PayboxButtonProps = {
  orderId: string;
  totals: Totals;
  billingAddress: PayboxAddress | null;
  shippingAddress: PayboxAddress | null;
  payboxConfig: PayboxConfig;
};

type PayboxGlobalHandler = {
  open?: (...args: any[]) => void;
};

type PayboxGlobal =
  | ((config: Record<string, any>) => PayboxGlobalHandler | void)
  | {
      configure?: (config: Record<string, any>) => PayboxGlobalHandler;
      open?: (...args: any[]) => void;
      checkout?: {
        configure?: (config: Record<string, any>) => PayboxGlobalHandler;
        open?: (...args: any[]) => void;
      };
    };

declare global {
  interface Window {
    Paybox?: PayboxGlobal;
    PayboxCheckout?: PayboxGlobal;
    $?: any;
    jQuery?: any;
  }
}

type SnackbarState = {
  open: boolean;
  message: string;
  severity: AlertColor;
};

export default function PayboxButton({
  orderId,
  totals,
  billingAddress,
  shippingAddress,
  payboxConfig,
}: PayboxButtonProps) {
  const router = useRouter();
  const [jqueryLoaded, setJqueryLoaded] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [openAttempted, setOpenAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  const scriptUrl =
    payboxConfig.scriptUrls?.[payboxConfig.environment] ??
    (payboxConfig.environment === "production"
      ? DEFAULT_PRODUCTION_SCRIPT
      : DEFAULT_SANDBOX_SCRIPT);

  const currency = (totals.currency || payboxConfig.currency || "USD").toUpperCase();
  const customerAddress = billingAddress ?? shippingAddress;
  const customerEmail = billingAddress?.email ?? shippingAddress?.email ?? "";
  const customerName = `${billingAddress?.firstName ?? shippingAddress?.firstName ?? ""} ${
    billingAddress?.lastName ?? shippingAddress?.lastName ?? ""
  }`.trim();

  const data = useMemo(() => {
    const amount = {
      currency,
      subtotal: Number.isFinite(totals.subtotal) ? totals.subtotal : 0,
      discount: Number.isFinite(totals.discount) ? totals.discount : 0,
      shipping: Number.isFinite(totals.shipping) ? totals.shipping : 0,
      total: Number.isFinite(totals.total) ? totals.total : 0,
    };

    const addressPayload = customerAddress
      ? {
          firstName: customerAddress.firstName,
          lastName: customerAddress.lastName,
          email: customerAddress.email,
          phone: customerAddress.phone ?? undefined,
          documentType: customerAddress.documentType ?? undefined,
          document: customerAddress.document ?? undefined,
          line1: customerAddress.line1,
          line2: customerAddress.line2 ?? undefined,
          city: customerAddress.city,
          state: customerAddress.state ?? undefined,
          postalCode: customerAddress.postalCode ?? undefined,
          country: customerAddress.country,
        }
      : undefined;

    const extras = {
      orderId,
      subtotal: amount.subtotal,
      discount: amount.discount,
      shipping: amount.shipping,
      currency: amount.currency,
      ...(payboxConfig.extras ?? {}),
    };

    const flags = {
      environment: payboxConfig.environment,
      autoReturn: payboxConfig.flags?.autoReturn ?? true,
      generateInvoice: payboxConfig.flags?.generateInvoice ?? false,
      sendMail: payboxConfig.flags?.sendMail ?? true,
      showReceipt: payboxConfig.flags?.showReceipt ?? false,
    };

    return {
      Amount: amount,
      Merchant: {
        id: payboxConfig.merchantId ?? undefined,
        name: payboxConfig.merchantName ?? undefined,
        email: payboxConfig.merchantEmail,
      },
      Customer: {
        email: customerEmail,
        name: customerName || undefined,
        phone: customerAddress?.phone ?? undefined,
        document: customerAddress?.document ?? undefined,
        documentType: customerAddress?.documentType ?? undefined,
      },
      Address: addressPayload,
      Extras: extras,
      Flags: flags,
    };
  }, [
    currency,
    totals.subtotal,
    totals.discount,
    totals.shipping,
    totals.total,
    customerAddress,
    customerEmail,
    customerName,
    orderId,
    payboxConfig.extras,
    payboxConfig.flags,
    payboxConfig.environment,
    payboxConfig.merchantEmail,
    payboxConfig.merchantId,
    payboxConfig.merchantName,
  ]);

  const ready = jqueryLoaded && sdkLoaded;

  const closeSnackbar = useCallback(() => setSnackbar(null), []);

  const onAuthorize = useCallback(
    async (payload: unknown) => {
      setIsAuthorizing(true);
      try {
        const res = await fetch(`/api/orders/${orderId}/paybox/authorize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "No se pudo registrar el pago");
        }
        setSnackbar({
          open: true,
          severity: "success",
          message: "Pago autorizado correctamente.",
        });
        router.refresh();
      } catch (err: any) {
        console.error("Paybox authorization error", err);
        setSnackbar({
          open: true,
          severity: "error",
          message: err?.message || "No se pudo autorizar el pago.",
        });
      } finally {
        setIsAuthorizing(false);
      }
    },
    [orderId, router]
  );

  const handleOpen = useCallback(() => {
    setError(null);
    setOpenAttempted(true);

    if (!ready) {
      setError("El SDK de Paybox todavía se está cargando. Intenta nuevamente en unos segundos.");
      return;
    }

    const payboxGlobal = window.PayboxCheckout ?? window.Paybox;
    if (!payboxGlobal) {
      setError("No se pudo inicializar Paybox. Verifica la configuración del comercio.");
      return;
    }

    const config: Record<string, any> = {
      environment: payboxConfig.environment,
      publicKey: payboxConfig.publicKey ?? undefined,
      merchantId: payboxConfig.merchantId ?? undefined,
      merchantName: payboxConfig.merchantName ?? undefined,
      merchantEmail: payboxConfig.merchantEmail,
      buttonId: payboxConfig.extras?.buttonId ?? undefined,
    };

    let handler: PayboxGlobalHandler | undefined;
    try {
      if (typeof payboxGlobal === "function") {
        handler = payboxGlobal(config) || undefined;
      } else if (typeof payboxGlobal.configure === "function") {
        handler = payboxGlobal.configure(config);
      } else if (payboxGlobal.checkout && typeof payboxGlobal.checkout.configure === "function") {
        handler = payboxGlobal.checkout.configure(config);
      } else if (payboxGlobal.checkout && typeof payboxGlobal.checkout === "function") {
        handler = (payboxGlobal.checkout as any)(config);
      } else {
        handler = (payboxGlobal as PayboxGlobalHandler) ?? undefined;
      }
    } catch (err) {
      console.error("Error configuring Paybox", err);
      setError("No se pudo configurar el pago. Revisa la consola para más detalles.");
      return;
    }

    const openFn: ((...args: any[]) => void) | undefined =
      handler?.open ||
      (typeof payboxGlobal !== "function" && typeof payboxGlobal.open === "function"
        ? payboxGlobal.open
        : undefined) ||
      (payboxGlobal as any)?.checkout?.open;

    if (typeof openFn !== "function") {
      setError("El SDK de Paybox no expone un método de apertura compatible.");
      return;
    }

    const callbacks = {
      onAuthorize: (payload: unknown) => onAuthorize(payload),
      onClose: () => {
        setSnackbar({
          open: true,
          severity: "info",
          message: "Se cerró la ventana de pago.",
        });
      },
      onCancel: () => {
        setSnackbar({
          open: true,
          severity: "info",
          message: "El pago fue cancelado por el usuario.",
        });
      },
    };

    try {
      if (openFn.length >= 2) {
        openFn(data, callbacks);
      } else {
        openFn({ ...data, ...callbacks });
      }
    } catch (err) {
      console.error("Error opening Paybox", err);
      setError("No se pudo abrir la ventana de pago de Paybox.");
    }
  }, [data, onAuthorize, payboxConfig, ready]);

  return (
    <Box>
      <Script
        id="paybox-jquery"
        src={DEFAULT_JQUERY_URL}
        strategy="afterInteractive"
        onLoad={() => setJqueryLoaded(true)}
        onError={() => setError("No se pudo cargar la librería requerida por Paybox.")}
      />
      <Script
        id="paybox-sdk"
        src={scriptUrl}
        strategy="afterInteractive"
        onLoad={() => setSdkLoaded(true)}
        onError={() => setError("No se pudo cargar el SDK de Paybox.")}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={isAuthorizing || !ready}
        onClick={handleOpen}
        startIcon={isAuthorizing ? <CircularProgress color="inherit" size={18} /> : undefined}
      >
        {isAuthorizing ? "Procesando pago..." : "Pagar ahora"}
      </Button>

      {!ready && openAttempted && !error && (
        <Typography variant="body2" color="text.secondary" mt={1}>
          Cargando Paybox...
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!snackbar?.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snackbar ? (
          <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
}
