"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Typography,
  Stack,
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

type PaymentMethod = "CARD" | "BANK_TRANSFER" | null;

type PaymentMethodSelectorProps = {
  orderId: string;
  currentMethod: PaymentMethod;
  onMethodSelected: (method: PaymentMethod) => void;
};

export default function PaymentMethodSelector({
  orderId,
  currentMethod,
  onMethodSelected,
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    currentMethod
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMethod) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payment-method`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: selectedMethod }),
      });

      if (!res.ok) {
        throw new Error("No se pudo actualizar el método de pago");
      }

      onMethodSelected(selectedMethod);
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al seleccionar el método de pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Elegir método de pago
      </Typography>

      <FormControl component="fieldset" fullWidth sx={{ mt: 2 }}>
        <RadioGroup
          value={selectedMethod || ""}
          onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
        >
          <FormControlLabel
            value="CARD"
            control={<Radio />}
            label={
              <Stack direction="row" spacing={2} alignItems="center">
                <CreditCardIcon />
                <Box>
                  <Typography variant="body1">
                    Tarjeta de débito o crédito
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pago seguro con PLUX
                  </Typography>
                </Box>
              </Stack>
            }
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            value="BANK_TRANSFER"
            control={<Radio />}
            label={
              <Stack direction="row" spacing={2} alignItems="center">
                <AccountBalanceIcon />
                <Box>
                  <Typography variant="body1">
                    Transferencia bancaria
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Realiza una transferencia desde tu banco
                  </Typography>
                </Box>
              </Stack>
            }
          />
        </RadioGroup>
      </FormControl>

      <Button
        variant="contained"
        fullWidth
        onClick={handleSubmit}
        disabled={!selectedMethod || isSubmitting}
        sx={{ mt: 3 }}
      >
        {isSubmitting ? "Guardando..." : "Continuar"}
      </Button>
    </Paper>
  );
}
