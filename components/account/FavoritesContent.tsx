"use client";

import { useMemo } from "react";
import { Stack, Typography } from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import ProductCard, { UiProduct } from "@/components/products/ProductCard";
import { useFavorites } from "@/lib/useFavorites";

type FavoriteItem = {
  id: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
  };
};

type Props = {
  initialItems: FavoriteItem[];
};

export default function FavoritesContent({ initialItems }: Props) {
  const { favorites, isLoading } = useFavorites({
    fallbackData: { ok: true, items: initialItems },
  });

  const products: UiProduct[] = useMemo(() => {
    return favorites.map((fav) => ({
      id: fav.product.id,
      slug: fav.product.slug,
      name: fav.product.name,
      description: fav.product.description,
      price: fav.product.price,
      stock: fav.product.stock,
      imageUrl: fav.product.imageUrl,
    }));
  }, [favorites]);

  if (!isLoading && products.length === 0) {
    return (
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography variant="h6" fontWeight={700}>
          No tienes productos favoritos todavía
        </Typography>
        <Typography color="text.secondary">
          Guarda tus productos preferidos y accede a ellos rápidamente desde aquí.
        </Typography>
      </Stack>
    );
  }

  return (
    <Grid container spacing={3}>
      {products.map((product) => (
        <Grid key={product.id} item xs={12} sm={6} md={4}>
          <ProductCard product={product} />
        </Grid>
      ))}
    </Grid>
  );
}
