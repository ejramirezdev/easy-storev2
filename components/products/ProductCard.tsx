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
  stock: number;
};

export default function ProductCard({ product }: { product: UiProduct }) {
  const href = `/products/${encodeURIComponent(product.slug)}`;
  const isOutOfStock = product.stock <= 0;

  return (
    <ProductLinkCard href={href}>
      <Card
        sx={{
          bgcolor: "background.paper",
          borderRadius: 3,
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          boxShadow: "0 18px 45px rgba(0,0,0,0.4)",
          transform: "translate3d(0,0,0)",
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
          },
          "&:focus-within": {
            transform: "scale(1.02)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
          },
        }}
      >
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

        <CardContent sx={{ flex: 1, pb: 1.5 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            gutterBottom
            noWrap
            sx={{ color: "#fff" }}
          >
            {product.name}
          </Typography>

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
            <Box
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
              sx={{ display: "flex" }}
            >
              <AddToCartButton
                productId={product.id}
                variant="icon"
                disabled={isOutOfStock}
                tooltip={
                  isOutOfStock ? "Producto sin stock disponible" : undefined
                }
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </ProductLinkCard>
  );
}
