import {
  Box,
  Container,
  Typography,
  Divider,
  Chip,
  Stack,
  Paper,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import ProductGallery from "@/components/products/ProductGallery";
import AddToCartButton from "@/components/products/AddToCartButton";
import FavoriteToggleButton from "@/components/products/FavoriteToggleButton";
import ProductPageUnlocker from "@/components/products/ProductPageUnlocker";
import BackToProductsButton from "@/components/products/BackToProductsButton";

export default async function ProductDetailContent({
  product,
  showBackButton = true,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: any;
    stock: number;
    imageUrl: string | null;
    images: Array<{ id: string; url: string; alt: string | null }>;
    category: { name: string; slug: string } | null;
    createdAt: Date;
  };
  showBackButton?: boolean;
}) {
  const price = Number(product.price);

  return (
    <>
      <ProductPageUnlocker />
      <Container sx={{ py: 4 }}>
        {showBackButton && (
          <Box sx={{ mb: 2 }}>
            <BackToProductsButton />
          </Box>
        )}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <ProductGallery
              images={
                product.images?.map((img) => ({
                  id: img.id,
                  url: img.url,
                  alt: img.alt ?? null,
                })) ?? []
              }
              imageUrl={product.imageUrl ?? null}
              name={product.name}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Typography variant="h4" fontWeight={900}>
                {product.name}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" fontWeight={800} color="secondary">
                  ${price.toFixed(2)}
                </Typography>
                {product.stock <= 0 ? (
                  <Chip label="Agotado" color="default" size="small" />
                ) : (
                  <Chip
                    label={`Stock: ${product.stock}`}
                    color="success"
                    size="small"
                  />
                )}
                {product.category && (
                  <Chip
                    label={product.category.name}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: "rgba(255,255,255,0.2)" }}
                  />
                )}
              </Stack>

              {product.description && (
                <Typography
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-line" }}
                >
                  {product.description}
                </Typography>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                <AddToCartButton
                  productId={product.id}
                  disabled={product.stock <= 0}
                  variant="full"
                />
                <FavoriteToggleButton productId={product.id} />
              </Stack>

              <Paper
                variant="outlined"
                sx={{ p: 2, bgcolor: "rgba(255,255,255,0.02)", borderRadius: 2 }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Detalles
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={0.5}>
                  <Typography variant="body2">
                    Categoría: {product.category?.name ?? "—"}
                  </Typography>
                  <Typography variant="body2">
                    Publicado: {product.createdAt.toLocaleDateString()}
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

