"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import PaymentMethodSelector from "./PaymentMethodSelector";
import PayphoneButton, { PayphoneAddress, PayphoneConfig } from "./PayphoneButton";
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
  payphoneConfig: PayphoneConfig;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
  };
  billingAddress: PayphoneAddress | null;
  shippingAddress: PayphoneAddress | null;
};

export default function OrderPaymentSection({
  orderId,
  status,
  total,
  currentPaymentMethod,
  currentBank,
  receiptUrl,
  payphoneConfig,
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

  // Siempre mostrar el selector de métodos de pago
  // Si hay un método seleccionado, mostrar también el botón/formulario correspondiente
  return (
    <Box>
      <PaymentMethodSelector
        orderId={orderId}
        currentMethod={paymentMethod || currentPaymentMethod}
        onMethodSelected={(method) => {
          setPaymentMethod(method);
          // No refrescar inmediatamente, solo actualizar el estado local
        }}
      />
      
      {paymentMethod === "CARD" && (
        <Box sx={{ mt: 2 }}>
          <PayphoneButton
            orderId={orderId}
            totals={totals}
            billingAddress={billingAddress}
            shippingAddress={shippingAddress}
            payphoneConfig={payphoneConfig}
          />
        </Box>
      )}

      {paymentMethod === "BANK_TRANSFER" && (
        <Box sx={{ mt: 2 }}>
          <BankTransferForm
            orderId={orderId}
            total={total}
            currentBank={currentBank}
            receiptUrl={receiptUrl}
            onReceiptUploaded={() => {
              router.refresh(); // Refrescar para actualizar el estado
            }}
          />
        </Box>
      )}
    </Box>
  );
}
