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
import { BreadcrumbSchema } from "@/lib/structured-data";

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com";
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const productImage = product.imageUrl || product.images[0]?.url || `${siteUrl}/placeholder.jpg`;
  
  const breadcrumbItems = [
    { name: "Inicio", url: "/" },
    { name: "Productos", url: "/products" },
    { name: product.name, url: `/products/${product.slug}` },
  ];

  // Structured Data - Product
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || product.name,
    "image": productImage,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Easy Store"
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "USD",
      "price": price.toString(),
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Easy Store"
      }
    },
    "category": product.category?.name || "Productos Tecnológicos",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "10"
    }
  };

  const inModal = !showBackButton;

  const galleryEl = (
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
      compact={inModal}
      fillColumn={inModal}
    />
  );

  const detailStack = (
    <Stack spacing={2}>
      <Typography
        variant="h4"
        fontWeight={900}
        sx={{
          fontSize: inModal ? { xs: "1.35rem", sm: "2rem" } : undefined,
          wordBreak: "break-word",
        }}
      >
        {product.name}
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
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
          sx={{
            whiteSpace: "pre-line",
            wordBreak: "break-word",
            ...(inModal
              ? {
                  overflow: "visible",
                  maxHeight: "none",
                }
              : {
                  maxHeight: { xs: "200px", md: "none" },
                  overflow: { xs: "auto", md: "visible" },
                  pr: { xs: 1, md: 0 },
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    bgcolor: "rgba(255,255,255,0.05)",
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: "rgba(255,255,255,0.2)",
                    borderRadius: "3px",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.3)",
                    },
                  },
                }),
          }}
        >
          {product.description}
        </Typography>
      )}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <AddToCartButton
          productId={product.id}
          disabled={product.stock <= 0}
          variant="full"
        />
        <FavoriteToggleButton productId={product.id} />
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: "rgba(255,255,255,0.02)",
          borderRadius: 2,
        }}
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
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <BreadcrumbSchema items={breadcrumbItems} siteUrl={siteUrl} />
      <ProductPageUnlocker />
      {inModal ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "stretch" },
            gap: { xs: 1.5, md: 3 },
            px: { xs: 1.5, sm: 2 },
            py: { xs: 1, sm: 1.5 },
            pb: { xs: 2, md: 2.5 },
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              maxWidth: { md: "50%" },
              flex: { md: "1 1 50%" },
              minWidth: 0,
              minHeight: { md: 0 },
              display: { md: "flex" },
              flexDirection: { md: "column" },
            }}
          >
            {galleryEl}
          </Box>
          <Box
            sx={{
              flex: { md: "1 1 50%" },
              minWidth: 0,
              width: { xs: "100%", md: "50%" },
            }}
          >
            {detailStack}
          </Box>
        </Box>
      ) : (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {showBackButton && (
            <Box sx={{ mb: 2 }}>
              <BackToProductsButton />
            </Box>
          )}
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              {galleryEl}
            </Grid>
            <Grid item xs={12} md={6}>
              {detailStack}
            </Grid>
          </Grid>
        </Container>
      )}
    </>
  );
}

