import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Box, Chip, Container, Typography, Pagination, PaginationItem } from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import ProductCard, { UiProduct } from "@/components/products/ProductCard";

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

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const where =
    activeCat && activeCat !== "all"
      ? { category: { slug: activeCat } }
      : undefined;

  const totalProducts = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * pageSize;

  const products = await prisma.product.findMany({
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
  });

  const uiProducts: UiProduct[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description ?? null,
    imageUrl: p.imageUrl ?? p.images[0]?.url ?? null,
    price: Number(p.price),
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
        <Grid container spacing={2.5}>
          {uiProducts.map((p) => (
            <Grid key={p.id} item xs={12} sm={6} md={3} lg={3} xl={3}>
              <ProductCard product={p} />
            </Grid>
          ))}
        </Grid>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
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
