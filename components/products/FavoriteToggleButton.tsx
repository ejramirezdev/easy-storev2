"use client";

import { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
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
          color={favorited ? "error" : "default"}
          size={size}
          disabled={loading}
          sx={{ color: favorited ? "#ff5c8d" : "rgba(255,255,255,0.7)" }}
          aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          {favorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
      </span>
    </Tooltip>
  );
}
