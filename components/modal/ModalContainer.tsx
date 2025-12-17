"use client";

import { Dialog, DialogContent, DialogTitle, Button, Box } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUiLock } from "@/lib/ui-lock";
import { PRODUCT_MODAL_LOCK_ID } from "@/lib/locks";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function ModalContainer({
  onClosePath,
  children,
}: {
  onClosePath: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const openTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const releaseFailsafeRef = useRef<NodeJS.Timeout | null>(null);
  const { unlock: unlockLock } = useUiLock();

  const releaseProductLock = useCallback(() => {
    unlockLock(PRODUCT_MODAL_LOCK_ID);
  }, [unlockLock]);

  const navigateToClosePath = useCallback(() => {
    // Si el onClosePath es /products, incluir los filtros guardados
    if (onClosePath === "/products" && typeof window !== "undefined") {
      const savedFilters = sessionStorage.getItem("productFilters");
      if (savedFilters) {
        try {
          const filters = JSON.parse(savedFilters);
          const params = new URLSearchParams();
          if (filters.search) params.set("search", filters.search);
          if (filters.minPrice) params.set("minPrice", filters.minPrice);
          if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
          if (filters.cat) params.set("cat", filters.cat);
          if (filters.sort && filters.sort !== "newest")
            params.set("sort", filters.sort);

          const query = params.toString();
          const url = query ? `/products?${query}` : "/products";
          router.replace(url, { scroll: false });
          return;
        } catch (e) {
          console.error("Error parsing saved filters:", e);
        }
      }
    }
    router.replace(onClosePath, { scroll: false });
  }, [router, onClosePath]);

  useEffect(() => {
    const prefetchResult = router.prefetch(onClosePath) as unknown;

    if (
      typeof prefetchResult === "object" &&
      prefetchResult !== null &&
      "catch" in prefetchResult &&
      typeof (prefetchResult as Promise<unknown>).catch === "function"
    ) {
      (prefetchResult as Promise<unknown>).catch(() => {
        // prefetch es best-effort; ignoramos errores silenciosamente
      });
    }
  }, [router, onClosePath]);

  useEffect(() => {
    // El modal solo debe mostrarse cuando estamos en una ruta de producto
    // Y NO estamos en la ruta de cierre (/products)
    // Si pathname es /products, cerrar el modal
    if (!pathname || pathname === onClosePath) {
      setOpen(false);
      if (releaseFailsafeRef.current) {
        clearTimeout(releaseFailsafeRef.current);
        releaseFailsafeRef.current = null;
      }
      releaseProductLock();
      return;
    }

    // Si estamos en una ruta de producto (diferente de /products), abrir el modal
    // El intercepting route solo funciona cuando navegas desde /products hacia /products/[slug]
    // Si navegas directamente a /products/[slug], el intercepting route no debería interceptar
    // y este componente no debería renderizarse
    const isProductRoute = pathname.startsWith("/products/") && pathname !== "/products";
    
    if (isProductRoute) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        setOpen(true);
      }, 10);

      return () => {
        if (openTimerRef.current) {
          clearTimeout(openTimerRef.current);
          openTimerRef.current = null;
        }
      };
    }

    // Para otras rutas, no mostrar el modal
    setOpen(false);
  }, [pathname, onClosePath, releaseProductLock]);

  const handleClose = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }

    setOpen(false);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    navigateToClosePath();

    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      navigateToClosePath();
    }, 200); // volver a /products sin recargar

    if (releaseFailsafeRef.current) {
      clearTimeout(releaseFailsafeRef.current);
    }

    releaseFailsafeRef.current = setTimeout(() => {
      releaseFailsafeRef.current = null;
      releaseProductLock();
    }, 6000);
  };

  useEffect(() => {
    return () => {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      if (releaseFailsafeRef.current) {
        clearTimeout(releaseFailsafeRef.current);
      }
      releaseProductLock();
    };
  }, [releaseProductLock]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(8px)",
          borderRadius: 3,
          boxShadow: "0 0 40px rgba(0,0,0,0.6)",
        },
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(6px)",
          backgroundColor: "rgba(0,0,0,0.4)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 1,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          px: { xs: 2, sm: 3 },
          py: 1.5,
        }}
      >
        <Button
          onClick={handleClose}
          startIcon={<ArrowBackIcon />}
          color="inherit"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            px: 1,
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.08)",
            },
          }}
        >
          Volver
        </Button>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box>{children}</Box>
      </DialogContent>
    </Dialog>
  );
}
