import HeroCarousel from "@/components/home/Carousel";
import WhatsAppFab from "@/components/home/WhatsAppFab";
import ProductCard, { UiProduct } from "@/components/products/ProductCard";
import Grid from "@mui/material/GridLegacy";
import { Box, Container, Typography } from "@mui/material";
import { prisma } from "@/lib/prisma";

async function getFeaturedProducts(): Promise<UiProduct[]> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      imageUrl: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true },
      },
    },
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? null,
    imageUrl: product.imageUrl ?? product.images[0]?.url ?? null,
    price: Number(product.price),
  }));
}

export default async function Page() {
  const featured = await getFeaturedProducts();
  return (
    <>
      <HeroCarousel />

      {/* Sección de destacados (opcional por ahora) */}
      <Box component="section" sx={{ py: 8, bgcolor: "#0A0A0B" }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>
            Nuestros productos destacados
          </Typography>
          {featured.length === 0 ? (
            <Typography color="text.secondary">
              Estamos preparando los primeros productos.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {featured.map((product) => (
                <Grid item key={product.id} xs={12} sm={6} md={4}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      <WhatsAppFab phone="+593958720950" />
    </>
  );
}
