"use client";

import { useState } from "react";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { signIn, useSession } from "next-auth/react";
import { useFavorites } from "@/lib/useFavorites";

type Props = {
  productId: string;
  size?: "small" | "medium";
};

export default function FavoriteToggleButton({ productId, size = "medium" }: Props) {
  const { status } = useSession();
  const { isFavorite, add, remove } = useFavorites();
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const favorited = isFavorite(productId);

  const handleClick = async () => {
    if (status !== "authenticated") {
      signIn("google");
      return;
    }

    try {
      setLoading(true);
      if (favorited) {
        await remove(productId);
      } else {
        await add(productId);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}>
      <span>
        <IconButton
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void handleClick();
          }}
          size={size}
          disabled={loading}
          sx={{
            color: favorited ? theme.palette.error.main : "rgba(255,255,255,0.7)",
            bgcolor: favorited ? "rgba(255, 82, 82, 0.16)" : "rgba(255,255,255,0.08)",
            transition: "background-color 0.2s ease, color 0.2s ease",
            "&:hover": {
              bgcolor: favorited
                ? "rgba(255, 82, 82, 0.28)"
                : "rgba(255,255,255,0.16)",
            },
          }}
          aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          {favorited ? (
            <FavoriteIcon sx={{ color: theme.palette.error.main }} />
          ) : (
            <FavoriteBorderIcon sx={{ color: "rgba(255,255,255,0.9)" }} />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}
