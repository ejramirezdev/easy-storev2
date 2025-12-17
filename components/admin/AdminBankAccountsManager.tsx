"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Alert,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from "@mui/icons-material";

type BankAccount = {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  idNumber: string | null;
  email: string | null;
  isActive: boolean;
  sortOrder: number;
};

export default function AdminBankAccountsManager() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    bankName: "",
    accountType: "SAVINGS",
    accountNumber: "",
    accountHolder: "",
    idNumber: "",
    email: "",
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null); // Limpiar errores previos
      const res = await fetch("/api/admin/bank-accounts");
      
      if (!res.ok) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = "Error cargando cuentas";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear el error, usar el mensaje por defecto
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      setAccounts(data.accounts || []);
      setError(null); // Limpiar errores si la carga fue exitosa
    } catch (err: any) {
      // Solo mostrar error si realmente hay un problema
      // Un array vacío no es un error
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        bankName: account.bankName,
        accountType: account.accountType,
        accountNumber: account.accountNumber,
        accountHolder: account.accountHolder,
        idNumber: account.idNumber || "",
        email: account.email || "",
        isActive: account.isActive,
        sortOrder: account.sortOrder,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        bankName: "",
        accountType: "SAVINGS",
        accountNumber: "",
        accountHolder: "",
        idNumber: "",
        email: "",
        isActive: true,
        sortOrder: accounts.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
  };

  const handleSave = async () => {
    try {
      const url = editingAccount
        ? `/api/admin/bank-accounts/${editingAccount.id}`
        : "/api/admin/bank-accounts";
      const method = editingAccount ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error guardando cuenta");
      }

      await loadAccounts();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta cuenta bancaria?")) return;

    try {
      const res = await fetch(`/api/admin/bank-accounts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error eliminando cuenta");
      }

      await loadAccounts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    return type === "SAVINGS" ? "Ahorros" : "Corriente";
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando cuentas bancarias...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Cuentas Bancarias para Transferencias
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Agregar Cuenta
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!error && accounts.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No hay cuentas bancarias configuradas. Agrega una para que los clientes
              puedan realizar transferencias.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{ color: "text.secondary", pt: 1 }}>
                    <DragIcon />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <Typography variant="h6">{account.bankName}</Typography>
                      <Chip
                        label={getAccountTypeLabel(account.accountType)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {!account.isActive && (
                        <Chip label="Inactiva" size="small" color="error" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Número de cuenta:</strong> {account.accountNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Titular:</strong> {account.accountHolder}
                    </Typography>
                    {account.idNumber && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Cédula/RUC:</strong> {account.idNumber}
                      </Typography>
                    )}
                    {account.email && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Email:</strong> {account.email}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(account)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(account.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAccount ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre del Banco"
              fullWidth
              required
              value={formData.bankName}
              onChange={(e) =>
                setFormData({ ...formData, bankName: e.target.value })
              }
            />
            <FormControl fullWidth required>
              <InputLabel>Tipo de Cuenta</InputLabel>
              <Select
                value={formData.accountType}
                label="Tipo de Cuenta"
                onChange={(e) =>
                  setFormData({ ...formData, accountType: e.target.value })
                }
              >
                <MenuItem value="SAVINGS">Ahorros</MenuItem>
                <MenuItem value="CHECKING">Corriente</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Número de Cuenta"
              fullWidth
              required
              value={formData.accountNumber}
              onChange={(e) =>
                setFormData({ ...formData, accountNumber: e.target.value })
              }
            />
            <TextField
              label="Titular de la Cuenta"
              fullWidth
              required
              value={formData.accountHolder}
              onChange={(e) =>
                setFormData({ ...formData, accountHolder: e.target.value })
              }
            />
            <TextField
              label="Cédula/RUC del Titular"
              fullWidth
              value={formData.idNumber}
              onChange={(e) =>
                setFormData({ ...formData, idNumber: e.target.value })
              }
            />
            <TextField
              label="Email de Contacto"
              fullWidth
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <TextField
              label="Orden de Visualización"
              fullWidth
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
              }
              helperText="Orden en que se mostrará la cuenta (menor número = primero)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
              }
              label="Cuenta Activa"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !formData.bankName ||
              !formData.accountNumber ||
              !formData.accountHolder
            }
          >
            {editingAccount ? "Guardar Cambios" : "Crear Cuenta"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

