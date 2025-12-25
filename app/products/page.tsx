import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Box, 
  Container, 
  Typography, 
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import ProductCard, { UiProduct } from "@/components/products/ProductCard";
import ProductsFilters from "@/components/products/ProductsFilters";
import ProductPagination from "@/components/products/ProductPagination";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com";

export const metadata: Metadata = {
  title: "Productos Tecnológicos",
  description: "Explora nuestra amplia selección de productos tecnológicos y gadgets en Ecuador. Encuentra dispositivos electrónicos, accesorios, memorias, discos duros, tablets y más al mejor precio. Envío a todo el país.",
  keywords: [
    "productos tecnológicos Ecuador",
    "gadgets Ecuador",
    "dispositivos electrónicos Ecuador",
    "memorias RAM Ecuador",
    "discos duros Ecuador",
    "tablets Ecuador",
    "accesorios tecnología Ecuador",
    "comprar tecnología Ecuador",
  ],
  openGraph: {
    title: "Productos Tecnológicos | Easy Store Ecuador",
    description: "Catálogo completo de productos tecnológicos, gadgets y dispositivos electrónicos en Ecuador. Envío a todo el país.",
    url: `${siteUrl}/products`,
    type: "website",
    locale: "es_EC",
    siteName: "Easy Store",
    images: [
      {
        url: `${siteUrl}/api/og-image?type=default`,
        width: 1200,
        height: 630,
        alt: "Productos Tecnológicos - Easy Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Productos Tecnológicos | Easy Store",
    description: "Catálogo completo de productos tecnológicos en Ecuador.",
    images: [`${siteUrl}/api/og-image?type=default`],
  },
  alternates: {
    canonical: `${siteUrl}/products`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export const dynamic = "force-dynamic";

type SearchParams = { 
  cat?: string; 
  page?: string; 
  search?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const activeCat = (sp?.cat ?? "").trim();
  const searchQuery = (sp?.search ?? "").trim();
  const sortBy = (sp?.sort ?? "newest").trim();
  const minPrice = sp?.minPrice ? parseFloat(sp.minPrice) : undefined;
  const maxPrice = sp?.maxPrice ? parseFloat(sp.maxPrice) : undefined;
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

    // Construir where clause con múltiples filtros
    const where: any = {};
    
    // Filtro por categoría
    if (activeCat && activeCat !== "all") {
      where.category = { slug: activeCat };
    }
    
    // Filtro por búsqueda (nombre)
    if (searchQuery) {
      where.name = { contains: searchQuery, mode: "insensitive" };
    }
    
    // Filtro por rango de precio
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    totalProducts = await prisma.product.count({ where }).catch(() => 0);
    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * pageSize;

    // Construir orderBy según el tipo de ordenamiento
    let orderBy: any = { createdAt: "desc" }; // Por defecto: más recientes
    switch (sortBy) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      case "name_desc":
        orderBy = { name: "desc" };
        break;
      case "featured":
        orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    products = await prisma.product.findMany({
      where,
      orderBy,
      take: pageSize,
      skip,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        imageUrl: true,
        isFeatured: true,
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
    if (searchQuery) params.set("search", searchQuery);
    if (sortBy && sortBy !== "newest") params.set("sort", sortBy);
    if (minPrice !== undefined) params.set("minPrice", minPrice.toString());
    if (maxPrice !== undefined) params.set("maxPrice", maxPrice.toString());
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={900} sx={{ mb: 3 }}>
        Productos
      </Typography>

      {/* Filtros y búsqueda */}
      <ProductsFilters categories={categories} />

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
            <Grid key={p.id} item xs={6} sm={6} md={3} lg={3} xl={3}>
              <ProductCard product={p} />
            </Grid>
          ))}
        </Grid>
      )}

      {totalProducts > 0 && Math.ceil(totalProducts / pageSize) > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <ProductPagination
            count={Math.ceil(totalProducts / pageSize)}
            page={Math.min(requestedPage, Math.ceil(totalProducts / pageSize))}
          />
        </Box>
      )}
    </Container>
  );
}
