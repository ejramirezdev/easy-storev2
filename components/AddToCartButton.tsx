"use client";

import { useState, useTransition } from "react";
import { Button, CircularProgress, Snackbar } from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";

export default function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onAdd = () => {
    startTransition(async () => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) setOpen(true);
      // aquí podrías revalidar o disparar un estado global del mini-carrito
    });
  };

  return (
    <>
      <Button
        onClick={onAdd}
        startIcon={
          isPending ? <CircularProgress size={16} /> : <AddShoppingCartIcon />
        }
        variant="contained"
        color="secondary"
        disabled={disabled || isPending}
        fullWidth
      >
        Agregar al carrito
      </Button>
      <Snackbar
        open={open}
        autoHideDuration={1500}
        onClose={() => setOpen(false)}
        message="Agregado al carrito"
      />
    </>
  );
}
