"use client";

import { useState } from "react";
import { Button, CircularProgress, Snackbar, Tooltip } from "@mui/material";
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
            <Button
              onClick={onAdd}
              disabled={disabled || loading}
              aria-label="Agregar al carrito"
              sx={{
                bgcolor: "#000",
                color: "#fff",
                borderRadius: 2.5,
                px: 1.75,
                minWidth: 56,
                minHeight: 44,
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                transition: "transform 0.2s ease, background-color 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                  bgcolor: "#111",
                  transform: "translateY(-2px)",
                },
                "&.Mui-disabled": {
                  bgcolor: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                  boxShadow: "none",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={18} sx={{ color: "inherit" }} />
              ) : (
                <AddShoppingCartIcon fontSize="small" />
              )}
            </Button>
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
