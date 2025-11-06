"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import SearchIcon from "@mui/icons-material/Search";
import Link from "next/link";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Pagination from "@mui/material/Pagination";

type OrderStatus =
  | "PENDING"
  | "REVIEW"
  | "PAID"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELED";

type Order = {
  id: string;
  status: OrderStatus;
  total: string;
  paymentMethod: string | null;
  selectedBank: string | null;
  receiptUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string;
    product: { name: string } | null;
    service: { name: string } | null;
  }>;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  REVIEW: "En Revisión",
  PAID: "Pago Confirmado",
  SHIPPED: "Enviado",
  COMPLETED: "Completado",
  CANCELED: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  PENDING: "default",
  REVIEW: "warning",
  PAID: "success",
  SHIPPED: "info",
  COMPLETED: "success",
  CANCELED: "error",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error al cargar las órdenes");
      }

      setOrders(json.orders);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error al actualizar el estado");
      }

      // Actualizar la orden en el estado local
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (e: any) {
      alert(e.message || "Error al actualizar el estado");
    }
  };

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderToDelete}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error al eliminar la orden");
      }

      // Remover la orden del estado local
      setOrders((prev) => prev.filter((order) => order.id !== orderToDelete));
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch (e: any) {
      alert(e.message || "Error al eliminar la orden");
    }
  };

  const bankNames: Record<string, string> = {
    GUAYAQUIL: "Banco Guayaquil",
    PICHINCHA: "Banco Pichincha",
    PACIFICO: "Banco del Pacífico",
  };

  // Filtrar órdenes por término de búsqueda
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase().trim();
    const orderId = order.id.toLowerCase();
    const customerEmail = order.user.email.toLowerCase();
    const customerName = (order.user.name || "").toLowerCase();

    return (
      orderId.includes(searchLower) ||
      customerEmail.includes(searchLower) ||
      customerName.includes(searchLower)
    );
  });

  // Paginación
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambia el término de búsqueda
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>Cargando órdenes...</Typography>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Gestión de Órdenes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra las órdenes, cambia estados y elimina órdenes cuando sea
            necesario.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por ID de orden, email o nombre del cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            {searchTerm && (
              <Typography variant="body2" color="text.secondary">
                Mostrando {filteredOrders.length} de {orders.length} órdenes
              </Typography>
            )}
            {!searchTerm && (
              <Typography variant="body2" color="text.secondary">
                Total: {orders.length} órdenes
              </Typography>
            )}
            {totalPages > 1 && (
              <Typography variant="body2" color="text.secondary">
                Página {page} de {totalPages}
              </Typography>
            )}
          </Stack>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID Orden</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Método de Pago</TableCell>
                <TableCell>Comprobante</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      {searchTerm
                        ? `No se encontraron órdenes que coincidan con "${searchTerm}"`
                        : "No hay órdenes registradas"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${order.id}`}
                        style={{ color: "#1976d2", textDecoration: "none" }}
                      >
                        {order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {order.user.name || "Sin nombre"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.user.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <MenuItem key={value} value={value}>
                              {label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>${Number(order.total).toFixed(2)}</TableCell>
                    <TableCell>
                      {order.paymentMethod === "CARD" && (
                        <Chip label="Tarjeta" size="small" color="primary" />
                      )}
                      {order.paymentMethod === "BANK_TRANSFER" && (
                        <Box>
                          <Chip label="Transferencia" size="small" color="secondary" />
                          {order.selectedBank && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {bankNames[order.selectedBank] || order.selectedBank}
                            </Typography>
                          )}
                        </Box>
                      )}
                      {!order.paymentMethod && (
                        <Typography variant="caption" color="text.secondary">
                          No seleccionado
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.receiptUrl ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            component="img"
                            src={order.receiptUrl}
                            alt="Comprobante de pago"
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "divider",
                              cursor: "pointer",
                              "&:hover": {
                                opacity: 0.8,
                              },
                            }}
                            onClick={() => window.open(order.receiptUrl!, "_blank")}
                          />
                          <Link
                            href={order.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <IconButton size="small" color="primary">
                              <ImageIcon />
                            </IconButton>
                          </Link>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString("es-EC", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(order.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_event, value) => setPage(value)}
              color="secondary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Container>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar esta orden? Esta acción no se
            puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
