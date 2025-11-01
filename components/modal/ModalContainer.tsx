"use client";

import { Dialog, DialogContent } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    router.prefetch(onClosePath).catch(() => {
      // prefetch es best-effort; ignoramos errores silenciosamente
    });
  }, [router, onClosePath]);

  useEffect(() => {
    if (!pathname || pathname === onClosePath) {
      setOpen(false);
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
  }, [pathname, onClosePath]);

  const handleClose = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }

    setOpen(false);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      if (typeof window !== "undefined") {
        const historyState = window.history.state as
          | { idx?: number }
          | undefined;
        if (historyState?.idx && historyState.idx > 0) {
          router.back();
          return;
        }
      }
      router.replace(onClosePath);
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
    };
  }, []);

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
      <DialogContent sx={{ p: 0 }}>{children}</DialogContent>
    </Dialog>
  );
}
