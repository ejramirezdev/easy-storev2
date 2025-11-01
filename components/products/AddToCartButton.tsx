"use client";

import { useState } from "react";
import {
  Button,
  IconButton,
  CircularProgress,
  Snackbar,
  Tooltip,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { useCart } from "@/lib/useCart";

type Props = {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  variant?: "full" | "icon"; // 👈 nuevo
  tooltip?: string;
};

export default function AddToCartButton({
  productId,
  quantity = 1,
  disabled,
  variant = "full",
  tooltip = "Agregar al carrito",
}: Props) {
  const { add, isPending } = useCart({ fetchOnMount: false });
  const [open, setOpen] = useState(false);
  const loading = isPending(productId, "add");

  const onAdd = async () => {
    await add(productId, quantity);
    setOpen(true);
  };

  if (variant === "icon") {
    return (
      <>
        <Tooltip title={tooltip}>
          <span>
            <IconButton
              onClick={onAdd}
              disabled={disabled || loading}
              sx={{
                bgcolor: "#050505",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.6)",
                borderRadius: 2,
                width: 44,
                height: 44,
                transition: "background-color 0.2s ease, border-color 0.2s ease",
                "&:hover": {
                  bgcolor: "#151515",
                  borderColor: "#fff",
                },
                "&.Mui-disabled": {
                  bgcolor: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                  borderColor: "rgba(255,255,255,0.2)",
                },
              }}
              aria-label="Agregar al carrito"
            >
              {loading ? (
                <CircularProgress size={18} sx={{ color: "inherit" }} />
              ) : (
                <AddShoppingCartIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <Snackbar
          open={open}
          autoHideDuration={1200}
          onClose={() => setOpen(false)}
          message="Agregado al carrito"
        />
      </>
    );
  }

  // variante "full" (texto)
  return (
    <>
      <Button
        onClick={onAdd}
        startIcon={
          loading ? <CircularProgress size={16} /> : <AddShoppingCartIcon />
        }
        variant="contained"
        color="secondary"
        disabled={disabled || loading}
        fullWidth
      >
        {loading ? "Agregando..." : "Agregar al carrito"}
      </Button>
      <Snackbar
        open={open}
        autoHideDuration={1200}
        onClose={() => setOpen(false)}
        message="Agregado al carrito"
      />
    </>
  );
}
