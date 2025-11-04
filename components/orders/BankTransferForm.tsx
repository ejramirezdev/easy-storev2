"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Stack,
  Alert,
  TextField,
  InputLabelProps,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Image from "next/image";

type BankTransferFormProps = {
  orderId: string;
  total: number;
  currentBank?: string | null;
  receiptUrl?: string | null;
  onReceiptUploaded: () => void;
};

const BANKS = [
  { value: "GUAYAQUIL", label: "Banco Guayaquil" },
  { value: "PICHINCHA", label: "Banco Pichincha" },
  { value: "PACIFICO", label: "Banco del Pacífico" },
];

// Información de cuentas bancarias (esto debería venir de configuración)
const BANK_ACCOUNTS: Record<string, { account: string; type: string; name: string }> = {
  GUAYAQUIL: {
    account: "1234567890",
    type: "Ahorros",
    name: "Easy Store Ecuador",
  },
  PICHINCHA: {
    account: "0987654321",
    type: "Corriente",
    name: "Easy Store Ecuador",
  },
  PACIFICO: {
    account: "1122334455",
    type: "Ahorros",
    name: "Easy Store Ecuador",
  },
};

export default function BankTransferForm({
  orderId,
  total,
  currentBank,
  receiptUrl,
  onReceiptUploaded,
}: BankTransferFormProps) {
  const [selectedBank, setSelectedBank] = useState<string>(
    currentBank || ""
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(
    receiptUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleBankChange = async (bank: string) => {
    setSelectedBank(bank);
    try {
      const res = await fetch(`/api/orders/${orderId}/payment-method`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "BANK_TRANSFER",
          selectedBank: bank,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo actualizar el banco seleccionado");
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al seleccionar el banco");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona una imagen válida");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen debe ser menor a 5MB");
      return;
    }

    setReceiptFile(file);
    setError(null);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPayment = async () => {
    if (!selectedBank) {
      setError("Debes seleccionar un banco");
      return;
    }

    if (!receiptFile && !receiptUrl) {
      setError("Debes cargar el comprobante de transferencia");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("receipt", receiptFile!);

      const res = await fetch(`/api/orders/${orderId}/receipt`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "No se pudo confirmar el pago");
      }

      setSuccess(true);
      onReceiptUploaded();
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al confirmar el pago");
    } finally {
      setIsUploading(false);
    }
  };

  const bankInfo = selectedBank ? BANK_ACCOUNTS[selectedBank] : null;

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Transferencia bancaria
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecciona el banco desde el cual realizarás la transferencia
          </Typography>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="bank-select-label">Banco</InputLabel>
          <Select
            labelId="bank-select-label"
            value={selectedBank}
            label="Banco"
            onChange={(e) => handleBankChange(e.target.value)}
          >
            {BANKS.map((bank) => (
              <MenuItem key={bank.value} value={bank.value}>
                {bank.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {bankInfo && (
          <Box
            sx={{
              p: 2,
              bgcolor: "background.default",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Información para la transferencia:
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Banco:</strong> {BANKS.find((b) => b.value === selectedBank)?.label}
              </Typography>
              <Typography variant="body2">
                <strong>Tipo de cuenta:</strong> {bankInfo.type}
              </Typography>
              <Typography variant="body2">
                <strong>Número de cuenta:</strong> {bankInfo.account}
              </Typography>
              <Typography variant="body2">
                <strong>Titular:</strong> {bankInfo.name}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                <strong>Monto a transferir:</strong> ${total.toFixed(2)}
              </Typography>
            </Stack>
          </Box>
        )}

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Comprobante de transferencia
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sube una imagen del comprobante de transferencia
          </Typography>

          {receiptPreview && (
            <Box
              sx={{
                mb: 2,
                position: "relative",
                width: "100%",
                maxWidth: 400,
                height: 300,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Image
                src={receiptPreview}
                alt="Comprobante"
                fill
                style={{ objectFit: "contain" }}
              />
            </Box>
          )}

          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            fullWidth
            disabled={isUploading}
          >
            {receiptPreview ? "Cambiar comprobante" : "Cargar comprobante"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && (
          <Alert severity="success">
            ¡Pago confirmado! Te contactaremos pronto para verificar el pago y
            realizar el envío.
          </Alert>
        )}

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleConfirmPayment}
          disabled={!selectedBank || (!receiptFile && !receiptUrl) || isUploading || success}
          startIcon={<AccountBalanceIcon />}
        >
          {isUploading ? "Confirmando..." : "Confirmar pago"}
        </Button>
      </Stack>
    </Paper>
  );
}
