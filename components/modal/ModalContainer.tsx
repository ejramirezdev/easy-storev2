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
  const { unlock: unlockLock } = useUiLock();

  const releaseProductLock = useCallback(() => {
    unlockLock(PRODUCT_MODAL_LOCK_ID);
  }, [unlockLock]);

  const navigateToClosePath = useCallback(() => {
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
    if (!pathname || pathname === onClosePath) {
      setOpen(false);
      releaseProductLock();
      return;
    }

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

    releaseProductLock();

    navigateToClosePath();

    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      navigateToClosePath();
    }, 200); // volver a /products sin recargar
  };

  useEffect(() => {
    return () => {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
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
