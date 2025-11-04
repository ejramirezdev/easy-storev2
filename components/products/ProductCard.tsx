"use client";

import { Card, CardContent, Box, Typography } from "@mui/material";
import AddToCartButton from "@/components/products/AddToCartButton";
import ProductLinkCard from "@/components/products/ProductLinkCard";
import Image from "next/image";
import FavoriteToggleButton from "@/components/products/FavoriteToggleButton";

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
          <Box
            sx={{
              position: "absolute",
              top: { xs: 4, sm: 8 },
              right: { xs: 4, sm: 8 },
              zIndex: 2,
            }}
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
          >
            <FavoriteToggleButton productId={product.id} size="small" />
          </Box>
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

        <CardContent sx={{ flex: 1, pb: { xs: 0.75, sm: 1 }, px: { xs: 1, sm: 2 }, pt: { xs: 1.5, sm: 2 }, display: "flex", flexDirection: "column" }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ 
              color: "#fff",
              fontSize: { xs: "0.8125rem", sm: "1rem" },
              lineHeight: { xs: 1.3, sm: 1.4 },
              display: "-webkit-box",
              WebkitLineClamp: { xs: 2, sm: 1 },
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: { xs: 0.5, sm: 1 },
              wordBreak: "break-word",
            }}
          >
            {product.name}
          </Typography>

          {product.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: { xs: 2, sm: 2 },
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontSize: { xs: "0.6875rem", sm: "0.875rem" },
                lineHeight: { xs: 1.2, sm: 1.4 },
                mt: { xs: 0.25, sm: 0 },
                wordBreak: "break-word",
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
              mt: "auto",
              pt: { xs: 0.5, sm: 0.75 },
              minHeight: { xs: 28, sm: 44 },
            }}
          >
            <Typography 
              variant="h6" 
              fontWeight={800} 
              color="secondary"
              sx={{ 
                fontSize: { xs: "0.75rem", sm: "1.1rem" },
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
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
              sx={{ 
                display: "flex", 
                alignItems: "center",
                justifyContent: "center",
              }}
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
