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
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED" | "FREESHIP";
  value: number;
  minSubtotal: number | null;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  perUserLimit: number | null;
  usedCount: number;
  actualUses: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminCouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENT" as "PERCENT" | "FIXED" | "FREESHIP",
    value: "",
    minSubtotal: "",
    startsAt: "",
    endsAt: "",
    maxUses: "",
    perUserLimit: "",
    isActive: true,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/coupons");

      if (!res.ok) {
        let errorMessage = "Error cargando cupones";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear el error, usar el mensaje por defecto
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setCoupons(data.coupons || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Formato YYYY-MM-DDTHH:mm para datetime-local input
    return date.toISOString().slice(0, 16);
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value.toString(),
        minSubtotal: coupon.minSubtotal?.toString() || "",
        startsAt: formatDateForInput(coupon.startsAt),
        endsAt: formatDateForInput(coupon.endsAt),
        maxUses: coupon.maxUses?.toString() || "",
        perUserLimit: coupon.perUserLimit?.toString() || "",
        isActive: coupon.isActive,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        type: "PERCENT",
        value: "",
        minSubtotal: "",
        startsAt: "",
        endsAt: "",
        maxUses: "",
        perUserLimit: "",
        isActive: true,
      });
    }
    setValidationErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCoupon(null);
    setValidationErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar código
    if (!formData.code.trim()) {
      errors.code = "El código es requerido";
    } else if (formData.code.length < 3) {
      errors.code = "El código debe tener al menos 3 caracteres";
    } else if (!/^[A-Z0-9-_]+$/.test(formData.code.toUpperCase())) {
      errors.code = "Solo se permiten letras mayúsculas, números, guiones y guiones bajos";
    }

    // Validar valor
    if (formData.type !== "FREESHIP") {
      const valueNum = parseFloat(formData.value);
      if (!formData.value || isNaN(valueNum)) {
        errors.value = "El valor es requerido";
      } else if (formData.type === "PERCENT" && (valueNum < 0 || valueNum > 100)) {
        errors.value = "Para porcentajes, el valor debe estar entre 0 y 100";
      } else if (formData.type === "FIXED" && valueNum <= 0) {
        errors.value = "Para cantidad fija, el valor debe ser mayor a 0";
      }
    }

    // Validar minSubtotal (opcional)
    if (formData.minSubtotal) {
      const minSubtotalNum = parseFloat(formData.minSubtotal);
      if (isNaN(minSubtotalNum) || minSubtotalNum < 0) {
        errors.minSubtotal = "El subtotal mínimo debe ser mayor o igual a 0";
      }
    }

    // Validar fechas
    if (formData.startsAt && formData.endsAt) {
      const starts = new Date(formData.startsAt);
      const ends = new Date(formData.endsAt);
      if (ends < starts) {
        errors.endsAt = "La fecha de fin debe ser posterior a la fecha de inicio";
      }
    }

    // Validar límites numéricos
    if (formData.maxUses) {
      const maxUsesNum = parseInt(formData.maxUses);
      if (isNaN(maxUsesNum) || maxUsesNum < 1) {
        errors.maxUses = "El límite de usos debe ser mayor a 0";
      }
    }

    if (formData.perUserLimit) {
      const perUserLimitNum = parseInt(formData.perUserLimit);
      if (isNaN(perUserLimitNum) || perUserLimitNum < 1) {
        errors.perUserLimit = "El límite por usuario debe ser mayor a 0";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const payload: any = {
        code: formData.code.toUpperCase().trim(),
        type: formData.type,
        value: formData.type === "FREESHIP" ? 0 : parseFloat(formData.value),
        minSubtotal: formData.minSubtotal ? parseFloat(formData.minSubtotal) : null,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
        endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : null,
        isActive: formData.isActive,
      };

      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : "/api/admin/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.details && Array.isArray(data.details)) {
          const errors: Record<string, string> = {};
          data.details.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              errors[err.path[0]] = err.message;
            }
          });
          setValidationErrors(errors);
          throw new Error("Errores de validación");
        }
        throw new Error(data.error || "Error guardando cupón");
      }

      await loadCoupons();
      handleCloseDialog();
    } catch (err: any) {
      if (err.message !== "Errores de validación") {
        setError(err.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cupón? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error eliminando cupón");
      }

      await loadCoupons();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getCouponTypeLabel = (type: string) => {
    switch (type) {
      case "PERCENT":
        return "Porcentaje";
      case "FIXED":
        return "Cantidad Fija";
      case "FREESHIP":
        return "Envío Gratis";
      default:
        return type;
    }
  };

  const getCouponDisplayValue = (coupon: Coupon) => {
    switch (coupon.type) {
      case "PERCENT":
        return `${coupon.value}%`;
      case "FIXED":
        return `$${coupon.value.toFixed(2)}`;
      case "FREESHIP":
        return "Envío Gratis";
      default:
        return coupon.value.toString();
    }
  };

  const isCouponExpired = (coupon: Coupon) => {
    if (!coupon.endsAt) return false;
    return new Date(coupon.endsAt) < new Date();
  };

  const isCouponNotStarted = (coupon: Coupon) => {
    if (!coupon.startsAt) return false;
    return new Date(coupon.startsAt) > new Date();
  };

  const isCouponExhausted = (coupon: Coupon) => {
    if (!coupon.maxUses) return false;
    return coupon.actualUses >= coupon.maxUses;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando cupones...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Administrar Cupones de Descuento
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Crear Cupón
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!error && coupons.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No hay cupones creados. Crea uno para empezar a ofrecer descuentos a tus
              clientes.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {coupons.map((coupon) => {
            const expired = isCouponExpired(coupon);
            const notStarted = isCouponNotStarted(coupon);
            const exhausted = isCouponExhausted(coupon);

            return (
              <Card key={coupon.id}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap">
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {coupon.code}
                        </Typography>
                        <Chip
                          label={getCouponTypeLabel(coupon.type)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={getCouponDisplayValue(coupon)}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                        {!coupon.isActive && (
                          <Chip label="Inactivo" size="small" color="error" />
                        )}
                        {expired && (
                          <Chip label="Expirado" size="small" color="error" variant="outlined" />
                        )}
                        {notStarted && (
                          <Chip
                            label="Aún no vigente"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        {exhausted && (
                          <Chip label="Agotado" size="small" color="error" variant="outlined" />
                        )}
                      </Stack>

                      <Stack spacing={0.5} mt={1}>
                        {coupon.minSubtotal && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Subtotal mínimo:</strong> ${coupon.minSubtotal.toFixed(2)}
                          </Typography>
                        )}
                        {coupon.startsAt && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Válido desde:</strong>{" "}
                            {new Date(coupon.startsAt).toLocaleDateString("es-EC", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        )}
                        {coupon.endsAt && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Válido hasta:</strong>{" "}
                            {new Date(coupon.endsAt).toLocaleDateString("es-EC", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        )}
                        {coupon.maxUses && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Usos:</strong> {coupon.actualUses} / {coupon.maxUses}
                          </Typography>
                        )}
                        {coupon.perUserLimit && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Límite por usuario:</strong> {coupon.perUserLimit}
                          </Typography>
                        )}
                        {!coupon.maxUses && coupon.actualUses > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Total de usos:</strong> {coupon.actualUses}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(coupon)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(coupon.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCoupon ? "Editar Cupón" : "Nuevo Cupón"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Código del Cupón"
              fullWidth
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              error={!!validationErrors.code}
              helperText={validationErrors.code || "Solo letras mayúsculas, números, guiones y guiones bajos"}
              InputProps={{
                style: { textTransform: "uppercase" },
              }}
            />

            <FormControl fullWidth required>
              <InputLabel>Tipo de Cupón</InputLabel>
              <Select
                value={formData.type}
                label="Tipo de Cupón"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "PERCENT" | "FIXED" | "FREESHIP",
                  })
                }
              >
                <MenuItem value="PERCENT">Porcentaje de Descuento</MenuItem>
                <MenuItem value="FIXED">Cantidad Fija de Descuento</MenuItem>
                <MenuItem value="FREESHIP">Envío Gratis</MenuItem>
              </Select>
            </FormControl>

            {formData.type !== "FREESHIP" && (
              <TextField
                label={
                  formData.type === "PERCENT"
                    ? "Porcentaje de Descuento"
                    : "Cantidad de Descuento (USD)"
                }
                fullWidth
                required
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                error={!!validationErrors.value}
                helperText={
                  validationErrors.value ||
                  (formData.type === "PERCENT"
                    ? "Ingresa un valor entre 0 y 100"
                    : "Ingresa la cantidad en dólares")
                }
                inputProps={{
                  min: formData.type === "PERCENT" ? 0 : 0,
                  max: formData.type === "PERCENT" ? 100 : undefined,
                  step: formData.type === "PERCENT" ? 1 : 0.01,
                }}
              />
            )}

            {formData.type === "FREESHIP" && (
              <Alert severity="info">
                Este cupón otorgará envío gratis al aplicarse. No requiere valor adicional.
              </Alert>
            )}

            <Divider />

            <TextField
              label="Subtotal Mínimo (USD)"
              fullWidth
              type="number"
              value={formData.minSubtotal}
              onChange={(e) => setFormData({ ...formData, minSubtotal: e.target.value })}
              error={!!validationErrors.minSubtotal}
              helperText={
                validationErrors.minSubtotal ||
                "Opcional: Monto mínimo del carrito para aplicar el cupón"
              }
              inputProps={{ min: 0, step: 0.01 }}
            />

            <TextField
              label="Fecha de Inicio"
              fullWidth
              type="datetime-local"
              value={formData.startsAt}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Opcional: Fecha desde la cual el cupón será válido"
            />

            <TextField
              label="Fecha de Fin"
              fullWidth
              type="datetime-local"
              value={formData.endsAt}
              onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              error={!!validationErrors.endsAt}
              helperText={
                validationErrors.endsAt ||
                "Opcional: Fecha hasta la cual el cupón será válido"
              }
              InputLabelProps={{ shrink: true }}
            />

            <Divider />

            <TextField
              label="Límite de Usos Totales"
              fullWidth
              type="number"
              value={formData.maxUses}
              onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
              error={!!validationErrors.maxUses}
              helperText={
                validationErrors.maxUses ||
                "Opcional: Número máximo de veces que se puede usar este cupón"
              }
              inputProps={{ min: 1 }}
            />

            <TextField
              label="Límite de Usos por Usuario"
              fullWidth
              type="number"
              value={formData.perUserLimit}
              onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
              error={!!validationErrors.perUserLimit}
              helperText={
                validationErrors.perUserLimit ||
                "Opcional: Número máximo de veces que un mismo usuario puede usar este cupón"
              }
              inputProps={{ min: 1 }}
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
              label="Cupón Activo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.code || (formData.type !== "FREESHIP" && !formData.value)}
          >
            {editingCoupon ? "Guardar Cambios" : "Crear Cupón"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

