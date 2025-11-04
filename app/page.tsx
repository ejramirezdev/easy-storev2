import HeroCarousel from "@/components/home/Carousel";
import WhatsAppFab from "@/components/home/WhatsAppFab";
import ProductCard, { UiProduct } from "@/components/products/ProductCard";
import Grid from "@mui/material/GridLegacy";
import { Box, Container, Typography } from "@mui/material";
import { unstable_noStore as noStore } from "next/cache";

// Forzar renderizado dinámico para evitar problemas de conexión a BD durante el build
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

async function getFeaturedProducts(): Promise<UiProduct[]> {
  // Forzar que esta función no se cachee ni se pre-renderice
  noStore();

  // Detectar build time: si estamos en Vercel durante build, retornar vacío inmediatamente
  // Vercel establece VERCEL=1 durante build, pero también durante runtime
  // Usamos NEXT_PHASE para detectar específicamente la fase de build
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return [];
  }

  // Si no hay DATABASE_URL configurada, retornar vacío
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    // Importar Prisma dinámicamente solo si no estamos en build time
    const prismaModule = await import("@/lib/prisma");
    const prisma = prismaModule.prisma;

    // Si prisma es null o undefined (puede pasar durante build), retornar vacío
    if (!prisma) {
      return [];
    }

    const products = await prisma.product
      .findMany({
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
          stock: true,
        },
      })
      .catch((error: any) => {
        // Capturar específicamente errores de conexión de Prisma
        if (
          error?.message?.includes("Can't reach database") ||
          error?.code === "P1001" ||
          error?.name === "PrismaClientInitializationError"
        ) {
          return [];
        }
        // Re-lanzar otros errores para que sean capturados por el catch externo
        throw error;
      });

    if (!products || products.length === 0) {
      return [];
    }

    return products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description ?? null,
      imageUrl: product.imageUrl ?? product.images[0]?.url ?? null,
      price: Number(product.price),
      stock: product.stock,
    }));
  } catch (error: any) {
    // Cualquier error, retornar array vacío silenciosamente
    // No hacer log durante build para evitar ruido
    return [];
  }
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
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
              {featured.map((product) => (
                <Grid item key={product.id} xs={6} sm={6} md={4}>
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
