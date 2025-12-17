"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, IconButton } from "@mui/material";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Img = { id: string; url: string; alt?: string | null };

export default function ProductGallery({
  images,
  imageUrl,
  name,
}: {
  images?: Img[] | null;
  imageUrl?: string | null;
  name: string;
}) {
  // Normaliza: imagen principal primero, luego galería, luego placeholder
  const normalized: Img[] = useMemo(() => {
    const galleryItems: (Img | null)[] = (images ?? [])
      .map((img, index) => {
        if (!img || typeof img.url !== "string") return null;

        const url = img.url.trim();
        if (!url) return null;

        return {
          id: img.id ?? `gallery-${index}`,
          url,
          alt: img.alt && img.alt.trim().length > 0 ? img.alt : name,
        } satisfies Img;
      });
    
    let gallery: Img[] = galleryItems.filter((img): img is Img => img !== null);

    const mainUrl =
      typeof imageUrl === "string" && imageUrl.trim().length > 0
        ? imageUrl.trim()
        : null;

    if (mainUrl) {
      const existingIndex = gallery.findIndex((img) => img.url === mainUrl);
      if (existingIndex >= 0) {
        const [existing] = gallery.splice(existingIndex, 1);
        gallery.unshift({ ...existing, alt: existing.alt ?? name });
      } else {
        gallery.unshift({ id: "main", url: mainUrl, alt: name });
      }
    }

    if (gallery.length === 0) {
      gallery.push({ id: "ph", url: "/placeholder.png", alt: name });
    }

    return gallery;
  }, [images, imageUrl, name]);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 para izquierda, 1 para derecha
  const total = normalized.length;
  
  useEffect(() => {
    setIndex((prev) => {
      if (total === 0) return 0;
      if (prev >= total) return total - 1;
      if (prev < 0) return 0;
      return prev;
    });
  }, [total]);
  
  const current = normalized[index] ?? normalized[0]; // 👈 siempre definido

  const next = () => {
    setDirection(1);
    setIndex((i) => (((i + 1) % total) + total) % total);
  };
  
  const prev = () => {
    setDirection(-1);
    setIndex((i) => (((i - 1) % total) + total) % total);
  };

  // Manejar deslizamiento táctil
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    
    if (info.offset.x > swipeThreshold) {
      // Deslizar a la derecha (imagen anterior)
      prev();
    } else if (info.offset.x < -swipeThreshold) {
      // Deslizar a la izquierda (siguiente imagen)
      next();
    }
  };

  if (!current) return null; // seguridad extra (no debería ocurrir)

  return (
    <Box>
      {/* Imagen principal */}
      <Box
        sx={{
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          bgcolor: "rgba(255,255,255,0.04)",
          // En móvil, hacer la galería más grande (aspect ratio más cuadrado)
          aspectRatio: { xs: "1 / 1", md: "16 / 10" },
          // En móvil, aumentar el tamaño mínimo
          minHeight: { xs: "400px", md: "auto" },
          touchAction: "pan-y", // Permitir scroll vertical pero capturar horizontal
        }}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.img
            key={current.id}
            src={current.url}
            alt={current.alt ?? name}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              cursor: total > 1 ? "grab" : "default",
            }}
          />
        </AnimatePresence>

        {/* Controles - Solo en desktop */}
        {total > 1 && (
          <>
            <IconButton
              onClick={prev}
              size="small"
              sx={{
                display: { xs: "none", sm: "flex" },
                position: "absolute",
                top: "50%",
                left: 8,
                transform: "translateY(-50%)",
                bgcolor: "rgba(0,0,0,0.5)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
              }}
            >
              <ChevronLeft size={18} />
            </IconButton>
            <IconButton
              onClick={next}
              size="small"
              sx={{
                display: { xs: "none", sm: "flex" },
                position: "absolute",
                top: "50%",
                right: 8,
                transform: "translateY(-50%)",
                bgcolor: "rgba(0,0,0,0.5)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
              }}
            >
              <ChevronRight size={18} />
            </IconButton>
          </>
        )}

        {/* Indicadores de puntos - Solo en móvil */}
        {total > 1 && (
          <Box
            sx={{
              display: { xs: "flex", sm: "none" },
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              gap: 1,
              bgcolor: "rgba(0,0,0,0.5)",
              borderRadius: "12px",
              px: 1.5,
              py: 0.75,
            }}
          >
            {normalized.map((_, i) => (
              <Box
                key={i}
                onClick={() => setIndex(i)}
                sx={{
                  width: i === index ? 24 : 8,
                  height: 8,
                  borderRadius: "4px",
                  bgcolor: i === index ? "#D81B9C" : "rgba(255,255,255,0.5)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Thumbs */}
      {total > 1 && (
        <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
          {normalized.map((img, i) => {
            const active = i === index;
            return (
              <Box
                key={img.id}
                onClick={() => setIndex(i)}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 1.5,
                  overflow: "hidden",
                  border: active
                    ? "2px solid #D81B9C"
                    : "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  bgcolor: "rgba(255,255,255,0.04)",
                  flexShrink: 0,
                }}
              >
                <Box
                  component="img"
                  src={img.url}
                  alt={img.alt ?? name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
