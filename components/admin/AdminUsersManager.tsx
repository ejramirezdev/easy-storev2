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
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "OWNER" | "ADMIN";
  twoFactorEnabled: boolean;
  createdAt: string;
  permissions: {
    canManagePayphone: boolean;
    canManageUsers: boolean;
    canManageBankAccounts: boolean;
    canManageCoupons: boolean;
    canDeleteProducts: boolean;
  } | null;
};

type NonAdminUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export default function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [nonAdminUsers, setNonAdminUsers] = useState<NonAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNonAdmin, setLoadingNonAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    role: "ADMIN" as "ADMIN" | "OWNER",
    permissions: {
      canManagePayphone: false,
      canManageUsers: false,
      canManageBankAccounts: true,
      canManageCoupons: true,
      canDeleteProducts: true,
    },
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/users");

      if (!res.ok) {
        let errorMessage = "Error cargando usuarios";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear el error, usar el mensaje por defecto
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadNonAdminUsers = async (searchTerm: string = "") => {
    try {
      setLoadingNonAdmin(true);
      const res = await fetch("/api/admin/users/non-admin");

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      let filtered = data.users || [];
      
      // Filtrar por término de búsqueda
      if (searchTerm) {
        filtered = filtered.filter(
          (user: NonAdminUser) =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setNonAdminUsers(filtered);
    } catch (err: any) {
      console.error("Error loading non-admin users:", err);
    } finally {
      setLoadingNonAdmin(false);
    }
  };

  const handleOpenDialog = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        role: user.role,
        permissions: user.permissions || {
          canManagePayphone: false,
          canManageUsers: false,
          canManageBankAccounts: true,
          canManageCoupons: true,
          canDeleteProducts: true,
        },
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: "",
        role: "ADMIN",
        permissions: {
          canManagePayphone: false,
          canManageUsers: false,
          canManageBankAccounts: true,
          canManageCoupons: true,
          canDeleteProducts: true,
        },
      });
      // Cargar usuarios no-admin cuando se abre el diálogo para crear
      loadNonAdminUsers();
    }
    setValidationErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setValidationErrors({});
  };

  const handleSave = async () => {
    if (editingUser) {
      // Actualizar usuario existente
      try {
        const payload: any = {
          role: formData.role,
          permissions: formData.role === "ADMIN" ? formData.permissions : undefined,
        };

        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PUT",
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
          throw new Error(data.error || "Error guardando usuario");
        }

        await loadUsers();
        handleCloseDialog();
      } catch (err: any) {
        if (err.message !== "Errores de validación") {
          setError(err.message);
        }
      }
    } else {
      // Crear nuevo admin
      if (!formData.email) {
        setError("Debes seleccionar un usuario");
        return;
      }

      try {
        const payload = {
          email: formData.email,
          role: formData.role,
          permissions: formData.permissions,
        };

        const res = await fetch("/api/admin/users", {
          method: "POST",
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
          throw new Error(data.error || "Error creando usuario admin");
        }

        await loadUsers();
        handleCloseDialog();
      } catch (err: any) {
        if (err.message !== "Errores de validación") {
          setError(err.message);
        }
      }
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar a ${email} como administrador? Esta acción cambiará su rol a CUSTOMER.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error eliminando usuario");
      }

      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Propietario";
      case "ADMIN":
        return "Administrador";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Gestión de Usuarios Administradores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Agregar Administrador
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {users.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No hay usuarios administradores configurados.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap">
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {user.name || user.email}
                      </Typography>
                      <Chip
                        label={getRoleLabel(user.role)}
                        size="small"
                        color={user.role === "OWNER" ? "primary" : "secondary"}
                        variant="outlined"
                      />
                      {user.twoFactorEnabled ? (
                        <Chip
                          label="2FA Activado"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="2FA No Activado"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {user.email}
                    </Typography>

                    {user.role === "ADMIN" && user.permissions && (
                      <Stack spacing={0.5} mt={1}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Permisos:</strong>
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {user.permissions.canManagePayphone && (
                            <Chip label="Payphone" size="small" />
                          )}
                          {user.permissions.canManageUsers && (
                            <Chip label="Usuarios" size="small" />
                          )}
                          {user.permissions.canManageBankAccounts && (
                            <Chip label="Cuentas Bancarias" size="small" />
                          )}
                          {user.permissions.canManageCoupons && (
                            <Chip label="Cupones" size="small" />
                          )}
                          {user.permissions.canDeleteProducts && (
                            <Chip label="Eliminar Productos" size="small" />
                          )}
                        </Stack>
                      </Stack>
                    )}

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Creado:</strong>{" "}
                      {new Date(user.createdAt).toLocaleDateString("es-EC", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(user)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(user.id, user.email)}
                      disabled={user.role === "OWNER"}
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? "Editar Usuario Administrador" : "Nuevo Usuario Administrador"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editingUser ? (
              <>
                <TextField
                  label="Email"
                  fullWidth
                  value={formData.email}
                  disabled
                  helperText="El email no se puede modificar"
                />

                <FormControl fullWidth required>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={formData.role}
                    label="Rol"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "ADMIN" | "OWNER",
                      })
                    }
                    disabled={editingUser.role === "OWNER"}
                  >
                    <MenuItem value="ADMIN">Administrador</MenuItem>
                    <MenuItem value="OWNER" disabled>
                      Propietario (no se puede asignar desde aquí)
                    </MenuItem>
                  </Select>
                </FormControl>
              </>
            ) : (
              <>
                <Autocomplete
                  options={nonAdminUsers}
                  getOptionLabel={(option) => option.email}
                  loading={loadingNonAdmin}
                  onInputChange={(_, value) => {
                    loadNonAdminUsers(value);
                  }}
                  onChange={(_, value) => {
                    if (value) {
                      setFormData({ ...formData, email: value.email });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Seleccionar Usuario"
                      placeholder="Buscar por email..."
                      error={!!validationErrors.email}
                      helperText={
                        validationErrors.email ||
                        "Busca y selecciona un usuario que haya iniciado sesión al menos una vez"
                      }
                    />
                  )}
                />
              </>
            )}

            {formData.role === "ADMIN" && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Permisos Individuales
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.permissions.canManagePayphone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            canManagePayphone: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Gestionar Configuración de Payphone"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.permissions.canManageUsers}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            canManageUsers: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Gestionar Usuarios Administradores"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.permissions.canManageBankAccounts}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            canManageBankAccounts: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Gestionar Cuentas Bancarias"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.permissions.canManageCoupons}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            canManageCoupons: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Gestionar Cupones"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.permissions.canDeleteProducts}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            canDeleteProducts: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Eliminar Productos"
                />
              </>
            )}

            {formData.role === "OWNER" && (
              <Alert severity="info">
                Los usuarios OWNER tienen todos los permisos automáticamente.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!editingUser && !formData.email}
          >
            {editingUser ? "Guardar Cambios" : "Crear Administrador"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

