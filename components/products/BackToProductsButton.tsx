"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function BackToProductsButton({
  fallback = "/products",
}: {
  fallback?: string;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallback, { scroll: false });
  };

  return (
    <Button
      onClick={handleBack}
      startIcon={<ArrowBackIcon />}
      variant="text"
      sx={{
        color: "#fff",
        alignSelf: "flex-start",
        px: 0,
        "&:hover": {
          backgroundColor: "rgba(255,255,255,0.06)",
        },
      }}
    >
      Volver
    </Button>
  );
}
