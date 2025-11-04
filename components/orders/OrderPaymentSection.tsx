"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import PaymentMethodSelector from "./PaymentMethodSelector";
import PayboxButton, { PayboxAddress, PayboxConfig } from "./PayboxButton";
import BankTransferForm from "./BankTransferForm";
import { useRouter } from "next/navigation";

type PaymentMethod = "CARD" | "BANK_TRANSFER" | null;

type OrderPaymentSectionProps = {
  orderId: string;
  status: string;
  total: number;
  currentPaymentMethod: PaymentMethod;
  currentBank: string | null;
  receiptUrl: string | null;
  payboxConfig: PayboxConfig;
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
    currency: string;
  };
  billingAddress: PayboxAddress | null;
  shippingAddress: PayboxAddress | null;
};

export default function OrderPaymentSection({
  orderId,
  status,
  total,
  currentPaymentMethod,
  currentBank,
  receiptUrl,
  payboxConfig,
  totals,
  billingAddress,
  shippingAddress,
}: OrderPaymentSectionProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    currentPaymentMethod
  );
  const router = useRouter();

  // Si el estado no es PENDING, no mostrar opciones de pago
  if (status !== "PENDING") {
    return (
      <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2 }}>
        {status === "REVIEW" && (
          <Box>
            <p style={{ color: "#ff9800", fontWeight: 600 }}>
              ⏳ Tu pago está en revisión. Te contactaremos pronto.
            </p>
            {receiptUrl && (
              <p style={{ fontSize: "0.875rem", marginTop: "8px" }}>
                Comprobante cargado exitosamente.
              </p>
            )}
          </Box>
        )}
        {status === "PAID" && (
          <p style={{ color: "#4caf50", fontWeight: 600 }}>
            ✅ Pago confirmado. Preparando tu pedido...
          </p>
        )}
        {(status === "SHIPPED" || status === "COMPLETED") && (
          <p style={{ color: "#2196f3", fontWeight: 600 }}>
            📦 Pedido {status === "COMPLETED" ? "entregado" : "en camino"}
          </p>
        )}
        {status === "CANCELED" && (
          <p style={{ color: "#f44336", fontWeight: 600 }}>
            ❌ Orden cancelada
          </p>
        )}
      </Box>
    );
  }

  // Si no hay método de pago seleccionado, mostrar el selector
  if (!paymentMethod) {
    return (
      <PaymentMethodSelector
        orderId={orderId}
        currentMethod={paymentMethod}
        onMethodSelected={(method) => {
          setPaymentMethod(method);
          router.refresh(); // Refrescar para obtener los datos actualizados
        }}
      />
    );
  }

  // Si el método es CARD, mostrar PayboxButton
  if (paymentMethod === "CARD") {
    return (
      <Box>
        <PayboxButton
          orderId={orderId}
          totals={totals}
          billingAddress={billingAddress}
          shippingAddress={shippingAddress}
          payboxConfig={payboxConfig}
        />
      </Box>
    );
  }

  // Si el método es BANK_TRANSFER, mostrar el formulario de transferencia
  if (paymentMethod === "BANK_TRANSFER") {
    return (
      <BankTransferForm
        orderId={orderId}
        total={total}
        currentBank={currentBank}
        receiptUrl={receiptUrl}
        onReceiptUploaded={() => {
          router.refresh(); // Refrescar para actualizar el estado
        }}
      />
    );
  }

  return null;
}
