"use client";

import { Card, CardContent, Box, Typography } from "@mui/material";
import AddToCartButton from "@/components/products/AddToCartButton";
import ProductLinkCard from "@/components/products/ProductLinkCard";
import Image from "next/image";

export type UiProduct = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
};

export default function ProductCard({ product }: { product: UiProduct }) {
  const href = `/products/${encodeURIComponent(product.slug)}`;

  return (
    <Card
      sx={{
        bgcolor: "background.paper",
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Zona clickeable protegida por el guard */}
      <ProductLinkCard href={`/products/${product.slug}`}>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            pt: "66.66%",
            bgcolor: "rgba(255,255,255,0.04)",
            overflow: "hidden",
          }}
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 600px) 90vw, (max-width: 900px) 45vw, 30vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
                fontSize: 14,
              }}
            >
              Sin imagen
            </Box>
          )}
        </Box>
      </ProductLinkCard>

      <CardContent sx={{ flex: 1, pb: 1.5 }}>
        <ProductLinkCard href={`/products/${product.slug}`}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            gutterBottom
            noWrap
            sx={{ color: "#fff" }}
          >
            {product.name}
          </Typography>
        </ProductLinkCard>

        {product.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: 36,
            }}
          >
            {product.description}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 1,
          }}
        >
          <Typography variant="h6" fontWeight={800} color="secondary">
            ${Number(product.price).toFixed(2)}
          </Typography>
          <AddToCartButton productId={product.id} variant="icon" />
        </Box>
      </CardContent>
    </Card>
  );
}
