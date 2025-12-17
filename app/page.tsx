import HeroCarousel from "@/components/home/Carousel";
import WhatsAppFab from "@/components/home/WhatsAppFab";
import InstagramFab from "@/components/home/InstagramFab";
import ProductCard, { UiProduct } from "@/components/products/ProductCard";
import Grid from "@mui/material/GridLegacy";
import { Box, Container, Typography } from "@mui/material";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com";

export const metadata: Metadata = {
  title: "Easy Store - Productos Tecnológicos y Servicios en Ecuador | Tienda Online",
  description: "Tienda de productos tecnológicos, gadgets y servicios en Ecuador. Encuentra dispositivos electrónicos, reparación de laptops y desarrollo de software.",
  keywords: [
    "tienda tecnología Ecuador",
    "productos tecnológicos Ecuador",
    "gadgets Ecuador",
    "reparación laptops Ecuador",
    "desarrollo software Ecuador",
    "comprar tecnología Ecuador",
    "tienda online Ecuador",
    "ecommerce Ecuador",
  ],
  openGraph: {
    title: "Easy Store - Productos Tecnológicos y Servicios en Ecuador",
    description: "Tienda de productos tecnológicos, gadgets y servicios de reparación y desarrollo de software en Ecuador. Innovación al alcance de tus manos.",
    url: siteUrl,
    type: "website",
    locale: "es_EC",
    siteName: "Easy Store",
    images: [
      {
        url: `${siteUrl}/api/og-image?type=default`,
        width: 1200,
        height: 630,
        alt: "Easy Store - Productos Tecnológicos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Easy Store - Productos Tecnológicos y Servicios en Ecuador",
    description: "Tienda de productos tecnológicos, gadgets y servicios en Ecuador.",
    images: [`${siteUrl}/api/og-image?type=default`],
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Forzar renderizado dinámico para evitar problemas de conexión a BD durante el build
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

async function getFeaturedProducts(): Promise<UiProduct[]> {
  // Forzar que esta función no se cachee ni se pre-renderice
  noStore();

  // Detectar build time: si estamos en Vercel durante build, retornar vacío inmediatamente
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return [];
  }

  try {
    // Si prisma es null o undefined (solo durante build), retornar vacío
    if (!prisma) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "❌ Prisma Client no está disponible. Verifica tu configuración de DATABASE_URL."
        );
      }
      return [];
    }

    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
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
    });

    // Log para debugging en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log(`[Featured Products] Encontrados ${products.length} productos destacados`);
      if (products.length > 0) {
        console.log("[Featured Products] Productos:", products.map(p => ({ name: p.name, isFeatured: p.isFeatured })));
      } else {
        // Verificar si hay productos con isFeatured en la BD
        const allProducts = await prisma.product.findMany({
          select: { id: true, name: true, isFeatured: true },
          take: 10,
        });
        console.log("[Featured Products] Primeros 10 productos en BD:", allProducts.map(p => ({ name: p.name, isFeatured: p.isFeatured })));
      }
    }

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
    // En desarrollo, mostrar el error completo para debugging
    if (process.env.NODE_ENV === "development") {
      console.error(
        "❌ Error al obtener productos destacados:",
        error?.message || error
      );
      if (error?.message?.includes("Can't reach database")) {
        console.error("💡 Verifica que:");
        console.error("   1. Tu DATABASE_URL en .env sea correcta");
        console.error("   2. La base de datos de Supabase esté activa");
        console.error(
          "   3. Tu IP esté permitida en Supabase (si es necesario)"
        );
        console.error("   4. El pooler de Supabase esté accesible");
      }
    }
    // En producción, retornar vacío silenciosamente
    return [];
  }
}

export default async function Page() {
  const featured = await getFeaturedProducts();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com";
  
  // Structured Data - WebSite with SearchAction
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Easy Store",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/products?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Structured Data - ItemList for featured products
  const itemListSchema = featured.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": featured.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "description": product.description || product.name,
        "image": product.imageUrl || `${siteUrl}/placeholder.jpg`,
        "url": `${siteUrl}/products/${product.slug}`,
        "offers": {
          "@type": "Offer",
          "price": product.price.toString(),
          "priceCurrency": "USD",
          "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
      }
    }))
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      
      <HeroCarousel />

      {/* Sección principal con H1 y contenido SEO - Oculto visualmente pero presente para SEO */}
      <Box 
        component="main" 
        sx={{ 
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <Container maxWidth="lg">
          <Typography 
            component="h1" 
            variant="h2" 
            sx={{ 
              mb: 4, 
              fontWeight: 900,
              fontSize: { xs: "2rem", md: "3rem" },
              textAlign: "center",
              color: "#FFFFFF"
            }}
          >
            Easy Store - Tu Tienda de Productos Tecnológicos en Ecuador
          </Typography>
          
          <Box sx={{ mb: 6, color: "#CCCCCC", lineHeight: 1.8 }}>
            <Typography variant="body1" component="p" sx={{ mb: 3, fontSize: "1.1rem" }}>
              Bienvenido a Easy Store. Somos tu destino principal para productos tecnológicos, gadgets y servicios especializados en Ecuador. 
              Ofrecemos una amplia selección de dispositivos electrónicos de última generación. Incluimos smartphones, tablets, 
              accesorios y componentes de computadoras. Nuestro catálogo incluye las mejores marcas del mercado. Garantizamos calidad 
              y rendimiento en cada compra.
            </Typography>
            
            <Typography variant="h3" component="h2" sx={{ mb: 3, mt: 5, fontWeight: 800, color: "#FFFFFF", fontSize: { xs: "1.5rem", md: "2rem" } }}>
              Productos Tecnológicos de Calidad
            </Typography>
            
            <Typography variant="body1" component="p" sx={{ mb: 3, fontSize: "1.1rem" }}>
              En Easy Store encontrarás una extensa variedad de productos tecnológicos. Están cuidadosamente seleccionados para satisfacer 
              todas tus necesidades. Trabajamos con proveedores confiables. Ofrecemos dispositivos electrónicos de alta calidad 
              a precios competitivos. Nuestro inventario incluye memorias RAM, discos duros SSD, tarjetas gráficas y procesadores. 
              Todos nuestros productos cuentan con garantía y soporte técnico especializado.
            </Typography>
            
            <Typography variant="h3" component="h2" sx={{ mb: 3, mt: 5, fontWeight: 800, color: "#FFFFFF", fontSize: { xs: "1.5rem", md: "2rem" } }}>
              Servicios de Reparación y Desarrollo
            </Typography>
            
            <Typography variant="body1" component="p" sx={{ mb: 3, fontSize: "1.1rem" }}>
              Además de nuestra tienda online, ofrecemos servicios profesionales. Incluimos reparación de hardware y desarrollo de software 
              a medida. Nuestro equipo de técnicos especializados puede diagnosticar y reparar laptops y computadoras de escritorio. 
              Utilizamos componentes de calidad garantizada. Ofrecemos servicio rápido y confiable. 
              También desarrollamos aplicaciones y sistemas de software personalizados. Están adaptados a las necesidades específicas de cada empresa.
            </Typography>
            
            <Typography variant="h3" component="h2" sx={{ mb: 3, mt: 5, fontWeight: 800, color: "#FFFFFF", fontSize: { xs: "1.5rem", md: "2rem" } }}>
              Envío a Todo Ecuador
            </Typography>
            
            <Typography variant="body1" component="p" sx={{ mb: 3, fontSize: "1.1rem" }}>
              Realizamos envíos a todo el territorio ecuatoriano. Aseguramos que recibas tus productos de forma rápida y segura. 
              Nuestro proceso de compra es sencillo y transparente. Ofrecemos múltiples métodos de pago. Incluimos tarjetas 
              de crédito, transferencias bancarias y Payphone. Ofrecemos atención al cliente personalizada. Estamos comprometidos 
              con tu satisfacción. Si tienes alguna pregunta o necesitas asesoría, nuestro equipo está disponible para ayudarte.
            </Typography>
            
            <Typography variant="h3" component="h2" sx={{ mb: 3, mt: 5, fontWeight: 800, color: "#FFFFFF", fontSize: { xs: "1.5rem", md: "2rem" } }}>
              Compromiso con la Calidad
            </Typography>
            
            <Typography variant="body1" component="p" sx={{ mb: 3, fontSize: "1.1rem" }}>
              En Easy Store, la calidad es nuestra prioridad. Todos los productos que vendemos son originales. Cuentan con garantía 
              del fabricante. Trabajamos únicamente con marcas reconocidas y proveedores autorizados. Aseguramos que recibas productos 
              auténticos y de primera calidad. Nuestro compromiso es brindarte la mejor experiencia de compra posible. Incluimos desde la 
              selección del producto hasta la entrega y el soporte post-venta.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Sección de destacados */}
      <Box component="section" sx={{ py: 8, bgcolor: "#0A0A0B" }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h2" sx={{ mb: 4, fontWeight: 800, color: "#FFFFFF", fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
            Nuestros Productos Destacados
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
      <InstagramFab url="https://www.instagram.com/easystoreecu/" />
    </>
  );
}
