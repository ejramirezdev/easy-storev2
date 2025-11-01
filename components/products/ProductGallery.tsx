"use client";

import { useMemo, useState } from "react";
import { Box, IconButton } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
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
  // Normaliza: primero relacionales, luego imageUrl, luego placeholder
  const normalized: Img[] = useMemo(() => {
    const ordered: Img[] = [];
    const seen = new Set<string>();

    const pushUnique = (img: Img) => {
      if (!img.url) return;
      if (seen.has(img.url)) return;
      seen.add(img.url);
      ordered.push(img);
    };

    if (imageUrl) {
      pushUnique({ id: "main", url: imageUrl, alt: name });
    }

    (images ?? []).forEach((img, index) => {
      if (!img || typeof img.url !== "string") return;
      const id = img.id ?? `gallery-${index}`;
      pushUnique({ id, url: img.url, alt: img.alt ?? name });
    });

    if (ordered.length === 0) {
      ordered.push({ id: "ph", url: "/placeholder.png", alt: name });
    }

    return ordered;
  }, [images, imageUrl, name]);

  const [index, setIndex] = useState(0);
  const total = normalized.length;
  const current = normalized[index] ?? normalized[0]; // 👈 siempre definido

  const next = () => setIndex((i) => (((i + 1) % total) + total) % total);
  const prev = () => setIndex((i) => (((i - 1) % total) + total) % total);

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
          aspectRatio: "16 / 10",
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={current.id}
            src={current.url}
            alt={current.alt ?? name}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </AnimatePresence>

        {/* Controles */}
        {total > 1 && (
          <>
            <IconButton
              onClick={prev}
              size="small"
              sx={{
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
