import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Box, Chip, Container, Typography, Pagination, PaginationItem } from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import ProductCard, { UiProduct } from "@/components/products/ProductCard";

export const dynamic = "force-dynamic";

type SearchParams = { cat?: string; page?: string };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const activeCat = (sp?.cat ?? "").trim();
  const rawPage = Number.parseInt((sp?.page ?? "").toString(), 10);
  const requestedPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = 24;

  let categories: Array<{ id: string; name: string; slug: string }> = [];
  let products: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: any;
    imageUrl: string | null;
    images: Array<{ url: string }>;
    stock: number;
  }> = [];
  let totalProducts = 0;

  try {
    // Verificar si Prisma está disponible
    if (!prisma) {
      throw new Error("Database not available");
    }

    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }).catch(() => []);

    const where =
      activeCat && activeCat !== "all"
        ? { category: { slug: activeCat } }
        : undefined;

    totalProducts = await prisma.product.count({ where }).catch(() => 0);
    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * pageSize;

    products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true, // Decimal
        imageUrl: true, // string | null
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
        stock: true,
      },
    }).catch(() => []);
  } catch (error: any) {
    // Si hay error de conexión, retornar arrays vacíos
    console.warn("Error fetching products:", error?.message || error);
    categories = [];
    products = [];
    totalProducts = 0;
  }

  const uiProducts: UiProduct[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description ?? null,
    imageUrl: p.imageUrl ?? p.images[0]?.url ?? null,
    price: Number(p.price),
    stock: p.stock,
  }));

  const createPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (activeCat && activeCat !== "all") {
      params.set("cat", activeCat);
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  };

  return (
    <Container sx={{ py: 4 }}>
      {/* Filtros */}
      <Box
        sx={{
          mb: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h4" fontWeight={900} sx={{ mr: 1 }}>
          Productos
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Link href="/products" style={{ textDecoration: "none" }}>
            <Chip
              label="Todos"
              clickable
              variant={
                !activeCat || activeCat === "all" ? "filled" : "outlined"
              }
              sx={{
                bgcolor:
                  !activeCat || activeCat === "all"
                    ? "rgba(216,27,156,0.2)"
                    : "transparent",
                color: "#fff",
                borderColor: "rgba(255,255,255,0.2)",
              }}
            />
          </Link>

          {categories.map((c) => {
            const selected = activeCat === c.slug;
            return (
              <Link
                key={c.id}
                href={`/products?cat=${encodeURIComponent(c.slug)}`}
                style={{ textDecoration: "none" }}
              >
                <Chip
                  label={c.name}
                  clickable
                  variant={selected ? "filled" : "outlined"}
                  sx={{
                    bgcolor: selected ? "rgba(216,27,156,0.2)" : "transparent",
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.2)",
                  }}
                />
              </Link>
            );
          })}
        </Box>
      </Box>

      {/* Grid */}
      {uiProducts.length === 0 ? (
        <Typography color="text.secondary">
          {activeCat
            ? "No hay productos para esta categoría."
            : "Aún no hay productos."}
        </Typography>
      ) : (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
          {uiProducts.map((p) => (
            <Grid key={p.id} item xs={4} sm={6} md={3} lg={3} xl={3}>
              <ProductCard product={p} />
            </Grid>
          ))}
        </Grid>
      )}

      {totalProducts > 0 && Math.ceil(totalProducts / pageSize) > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={Math.ceil(totalProducts / pageSize)}
            page={Math.min(requestedPage, Math.ceil(totalProducts / pageSize))}
            color="secondary"
            siblingCount={0}
            boundaryCount={1}
            renderItem={(item) => (
              <PaginationItem
                component={Link}
                href={createPageHref(item.page ?? 1)}
                {...item}
              />
            )}
          />
        </Box>
      )}
    </Container>
  );
}
