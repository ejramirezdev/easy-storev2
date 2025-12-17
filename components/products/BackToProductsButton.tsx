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
      // Intentar usar el historial del navegador primero
      router.back();
      return;
    }

    // Si no hay historial, construir la URL con los filtros guardados
    if (typeof window !== "undefined") {
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
          router.push(url, { scroll: false });
          return;
        } catch (e) {
          console.error("Error parsing saved filters:", e);
        }
      }
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
