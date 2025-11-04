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
  const isDisabled = disabled || loading;
  const tooltipTitle = disabled ? "Producto sin stock disponible" : tooltip;
  const buttonLabel = loading
    ? "Agregando..."
    : disabled
    ? "Sin stock disponible"
    : "Agregar al carrito";

  const onAdd = async () => {
    if (isDisabled) return;
    await add(productId, quantity);
    setOpen(true);
  };

  if (variant === "icon") {
    return (
      <>
        <Tooltip title={tooltipTitle}>
          <span>
            <Button
              onClick={onAdd}
              disabled={isDisabled}
              aria-label="Agregar al carrito"
              sx={{
                bgcolor: "#000",
                color: "#fff",
                borderRadius: { xs: 1, sm: 2.5 }, // Más rectangular en móvil
                px: { xs: 1, sm: 1.75 },
                minWidth: { xs: 40, sm: 56 }, // Más pequeño
                minHeight: { xs: 24, sm: 44 }, // Más pequeño
                width: { xs: 40, sm: "auto" },
                height: { xs: 24, sm: "auto" },
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
                <CircularProgress 
                  size={18}
                  sx={{ 
                    color: "inherit",
                    width: { xs: "12px", sm: "18px" },
                    height: { xs: "12px", sm: "18px" },
                  }} 
                />
              ) : (
                <AddShoppingCartIcon 
                  sx={{ 
                    fontSize: { xs: "0.875rem", sm: "1.25rem" },
                    width: { xs: "0.875rem", sm: "1.25rem" },
                    height: { xs: "0.875rem", sm: "1.25rem" },
                  }} 
                />
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
        disabled={isDisabled}
        fullWidth
      >
        {buttonLabel}
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
