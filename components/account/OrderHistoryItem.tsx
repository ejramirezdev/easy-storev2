"use client";

import { useState } from "react";
import {
  Box,
  Chip,
  Divider,
  Link as MuiLink,
  Stack,
  Typography,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type OrderStatus =
  | "PENDING"
  | "REVIEW"
  | "PAID"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELED";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice?: string | number; // Precio del item al momento de la orden
  product: {
    name: string;
    slug: string;
    imageUrl: string | null;
    images: Array<{ url: string }>;
  } | null;
  service: { name: string } | null;
};

type Address = {
  type: string;
  firstName: string;
  lastName: string;
  city: string;
};

type Order = {
  id: string;
  status: OrderStatus;
  total: string | number;
  createdAt: Date | string;
  items: OrderItem[];
  addresses: Address[];
};

type OrderHistoryItemProps = {
  order: Order;
};

export default function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  const router = useRouter();
  const [isCanceling, setIsCanceling] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = order.items.reduce(
    (acc, it) => {
      // Calcular desde unitPrice si está disponible (desde OrderItem)
      const itemPrice = it.unitPrice ? Number(it.unitPrice) : 0;
      return acc + itemPrice * it.quantity;
    },
    0
  );
  const discount = 0;
  const shipping = 0;
  const total = order.total
    ? Number(order.total)
    : subtotal - discount + shipping;
  const shippingAddress = order.addresses.find(
    (addr) => addr.type === "SHIPPING"
  );
  const orderStatus = order.status as OrderStatus;

  const handleCancelOrder = async () => {
    setIsCanceling(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error al cancelar la orden");
      }

      setDeleteDialogOpen(false);
      router.refresh(); // Refrescar la página para actualizar la lista
    } catch (e: any) {
      setError(e.message || "Error al cancelar la orden");
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <>
      <Stack
        spacing={2}
        sx={{
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 2,
          p: { xs: 2, md: 2.5 },
          bgcolor: "rgba(0,0,0,0.15)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          gap={1}
        >
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              Orden #{order.id.slice(0, 8).toUpperCase()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {typeof order.createdAt === "string"
                ? new Date(order.createdAt).toLocaleString()
                : order.createdAt.toLocaleString()}
            </Typography>
          </Stack>
                     <Chip
             label={
               orderStatus === "PENDING"
                 ? "Orden Creada"
                 : orderStatus === "REVIEW"
                 ? "Orden en Revisión"
                 : orderStatus === "PAID"
                 ? "Orden Pagada"
                 : orderStatus
             }
            sx={{
              alignSelf: { xs: "flex-start", sm: "center" },
              bgcolor:
                orderStatus === "PENDING"
                  ? "#9e9e9e"
                  : orderStatus === "REVIEW"
                  ? "#ff9800"
                  : orderStatus === "PAID"
                  ? "#4caf50"
                  : undefined,
              color:
                orderStatus === "PENDING" ||
                orderStatus === "REVIEW" ||
                orderStatus === "PAID"
                  ? "#fff"
                  : undefined,
              fontWeight: 600,
            }}
          />
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={1.5}>
          {order.items.map((item) => {
            const label =
              item.product?.name ?? item.service?.name ?? "Producto";
            const productSlug = item.product?.slug;
            const productImageUrl =
              item.product?.imageUrl ||
              item.product?.images?.[0]?.url ||
              null;

            if (productSlug && productImageUrl) {
              return (
                <Stack
                  key={item.id}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                >
                  <Link
                    href={`/products/${productSlug}`}
                    legacyBehavior
                    passHref
                  >
                    <Box
                      component="a"
                      sx={{
                        position: "relative",
                        width: 60,
                        height: 60,
                        borderRadius: 1,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.1)",
                        cursor: "pointer",
                        flexShrink: 0,
                        "&:hover": {
                          opacity: 0.8,
                        },
                      }}
                    >
                      <Image
                        src={productImageUrl}
                        alt={label}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </Box>
                  </Link>
                  <Box sx={{ flex: 1 }}>
                    <Link
                      href={`/products/${productSlug}`}
                      legacyBehavior
                      passHref
                    >
                      <MuiLink
                        underline="hover"
                        color="inherit"
                        sx={{ fontWeight: 500 }}
                      >
                        <Typography variant="body2">{label}</Typography>
                      </MuiLink>
                    </Link>
                    <Typography variant="caption" color="text.secondary">
                      Cantidad: {item.quantity}
                    </Typography>
                  </Box>
                </Stack>
              );
            }

            return (
              <Stack
                key={item.id}
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: "rgba(255,255,255,0.1)",
                    flexShrink: 0,
                  }}
                >
                  {label.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">{label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cantidad: {item.quantity}
                  </Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        <Stack spacing={0.5}>
          <Typography variant="body2">
            Subtotal: ${subtotal.toFixed(2)}
          </Typography>
          {discount > 0 && (
            <Typography variant="body2">
              Descuento: -${discount.toFixed(2)}
            </Typography>
          )}
          {shipping > 0 && (
            <Typography variant="body2">
              Envío: ${shipping.toFixed(2)}
            </Typography>
          )}
          <Typography variant="subtitle1" fontWeight={700}>
            Total: ${total.toFixed(2)}
          </Typography>
        </Stack>

        {shippingAddress && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Envío para:
            </Typography>
            <Typography variant="body2">
              {shippingAddress.firstName} {shippingAddress.lastName} -{" "}
              {shippingAddress.city}
            </Typography>
          </Box>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Link href={`/orders/${order.id}`} legacyBehavior passHref>
            <MuiLink underline="none" color="secondary" fontWeight={600}>
              Ver detalle
            </MuiLink>
          </Link>

          {orderStatus === "PENDING" && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isCanceling}
            >
              Ya no deseo este producto
            </Button>
          )}
        </Box>
      </Stack>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Cancelar orden</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas cancelar esta orden? Esta acción no se
            puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isCanceling}>
            No cancelar
          </Button>
          <Button
            onClick={handleCancelOrder}
            color="error"
            variant="contained"
            disabled={isCanceling}
          >
            {isCanceling ? "Cancelando..." : "Sí, cancelar orden"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
