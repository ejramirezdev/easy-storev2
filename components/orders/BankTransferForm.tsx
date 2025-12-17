"use client";

import { useState, useEffect } from "react";
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
  CircularProgress,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Image from "next/image";
import { refreshCartGlobally } from "@/lib/useCart";

type BankTransferFormProps = {
  orderId: string;
  total: number;
  currentBank?: string | null;
  receiptUrl?: string | null;
  onReceiptUploaded: () => void;
};

type BankAccount = {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  idNumber: string | null;
  email: string | null;
  isActive: boolean;
};

export default function BankTransferForm({
  orderId,
  total,
  currentBank,
  receiptUrl,
  onReceiptUploaded,
}: BankTransferFormProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
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

  // Cargar cuentas bancarias desde la API
  useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        const res = await fetch("/api/admin/bank-accounts");
        if (res.ok) {
          const data = await res.json();
          const activeAccounts = data.accounts.filter((acc: BankAccount) => acc.isActive);
          setBankAccounts(activeAccounts);
        }
      } catch (err) {
        console.error("Error cargando cuentas bancarias:", err);
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadBankAccounts();
  }, []);

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
      
      // Refrescar el carrito globalmente para que se actualice en todos los componentes
      await refreshCartGlobally();
      
      onReceiptUploaded();
    } catch (error: any) {
      console.error("Error:", error);
      setError(error.message || "Error al confirmar el pago");
    } finally {
      setIsUploading(false);
    }
  };

  const selectedAccount = bankAccounts.find((acc) => acc.id === selectedBank);

  if (loadingAccounts) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (bankAccounts.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="warning">
          No hay cuentas bancarias configuradas. Por favor, contacta al administrador.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Transferencia bancaria
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecciona la cuenta bancaria a la que realizarás la transferencia
          </Typography>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="bank-select-label">Cuenta Bancaria</InputLabel>
          <Select
            labelId="bank-select-label"
            value={selectedBank}
            label="Cuenta Bancaria"
            onChange={(e) => handleBankChange(e.target.value)}
          >
            {bankAccounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.bankName} - {account.accountType === "SAVINGS" ? "Ahorros" : "Corriente"} - {account.accountNumber}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedAccount && (
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
                <strong>Banco:</strong> {selectedAccount.bankName}
              </Typography>
              <Typography variant="body2">
                <strong>Tipo de cuenta:</strong> {selectedAccount.accountType === "SAVINGS" ? "Ahorros" : "Corriente"}
              </Typography>
              <Typography variant="body2">
                <strong>Número de cuenta:</strong> {selectedAccount.accountNumber}
              </Typography>
              <Typography variant="body2">
                <strong>Titular:</strong> {selectedAccount.accountHolder}
              </Typography>
              {selectedAccount.idNumber && (
                <Typography variant="body2">
                  <strong>Cédula/RUC:</strong> {selectedAccount.idNumber}
                </Typography>
              )}
              {selectedAccount.email && (
                <Typography variant="body2">
                  <strong>Email:</strong> {selectedAccount.email}
                </Typography>
              )}
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
