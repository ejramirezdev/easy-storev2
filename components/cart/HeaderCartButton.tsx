"use client";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CloseIcon from "@mui/icons-material/Close";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/useCart";
import { useUiLock } from "@/lib/ui-lock";

export default function HeaderCartButton() {
  const [open, setOpen] = useState(false);
  const { count, items, subtotal, isLoading, remove, inc, dec, isPending } =
    useCart();
  const { locked } = useUiLock();
  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        aria-label="Carrito"
        disabled={locked}
        color="inherit"
        sx={{
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 999,
          p: 0.75,
          transition: "border-color 0.2s ease, background-color 0.2s ease",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.45)",
            backgroundColor: "rgba(255,255,255,0.06)",
          },
          "&.Mui-disabled": {
            opacity: 0.5,
            borderColor: "rgba(255,255,255,0.1)",
          },
        }}
      >
        <Badge
          badgeContent={count}
          color="secondary"
          showZero={false}
          sx={{
            "& .MuiBadge-badge": {
              fontSize: 12,
              minWidth: 20,
              height: 20,
            },
          }}
        >
          <ShoppingCartIcon />
        </Badge>
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 380 },
          },
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", sm: 360 },
            maxWidth: "100vw",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Tu carrito</Typography>
            <IconButton
              onClick={() => setOpen(false)}
              aria-label="Cerrar carrito"
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />

          {isLoading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Typography sx={{ py: 4 }} color="text.secondary">
              Aún no tienes productos.
            </Typography>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  maxHeight: "50vh",
                  overflowY: "auto",
                }}
              >
                {items.map((it) => {
                  const loadInc = isPending(it.productId, "inc");
                  const loadDec = isPending(it.productId, "dec");
                  const loadRemove = isPending(it.productId, "remove");
                  const disabledAll = loadInc || loadDec || loadRemove;
                  const maxReached =
                    it.product.stock <= 0 ||
                    it.quantity >= it.product.stock;

                  return (
                    <Box
                      key={it.id}
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        p: 1.25,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        bgcolor: "background.default",
                        alignItems: "center",
                      }}
                    >
                      {/* Miniatura */}
                      <Box
                        sx={{
                          position: "relative",
                          width: 56,
                          height: 56,
                          flexShrink: 0,
                          borderRadius: 1.5,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.paper",
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          src={
                            it.product.imageUrl ??
                            "/window.svg"
                          }
                          alt={it.product.name}
                          fill
                          sizes="56px"
                          style={{ objectFit: "cover" }}
                        />
                      </Box>

                      {/* Info + controles */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              fontWeight={700}
                              noWrap
                              title={it.product.name}
                            >
                              {it.product.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ${Number(it.product.price).toFixed(2)}
                            </Typography>
                            {it.product.stock <= 0 ? (
                              <Typography variant="caption" color="error">
                                Sin stock disponible
                              </Typography>
                            ) : it.quantity >= it.product.stock ? (
                              <Typography variant="caption" color="text.secondary">
                                Stock disponible: {it.product.stock}
                              </Typography>
                            ) : null}
                        </Box>
                          <Typography fontWeight={800}>
                            $
                            {(Number(it.product.price) * it.quantity).toFixed(
                              2
                            )}
                          </Typography>
                        </Box>

                        {/* Controles */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 1,
                            opacity: disabledAll ? 0.75 : 1,
                          }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => dec(it.productId, it.quantity)}
                            disabled={disabledAll}
                          >
                            {loadDec ? <CircularProgress size={14} /> : "-"}
                          </Button>

                          <Typography>{it.quantity}</Typography>

                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => inc(it.productId, it.quantity)}
                            disabled={disabledAll || maxReached}
                          >
                            {loadInc ? <CircularProgress size={14} /> : "+"}
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            onClick={() => remove(it.productId)}
                            disabled={disabledAll}
                            sx={{ ml: 0.5 }}
                          >
                            {loadRemove ? (
                              <CircularProgress size={14} />
                            ) : (
                              "Quitar"
                            )}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              <Divider />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1">Subtotal</Typography>
                <Typography variant="h6">
                  ${Number(subtotal).toFixed(2)}
                </Typography>
              </Box>

              <Button
                component={Link}
                href="/cart"
                variant="contained"
                size="large"
                onClick={() => setOpen(false)}
              >
                Ir al carrito
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
}
