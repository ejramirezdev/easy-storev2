import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // URLs base estáticas - siempre se incluyen
  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/services/software`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/services/hardware`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Agregar productos y categorías dinámicamente
  let productUrls: MetadataRoute.Sitemap = [];
  let categoryUrls: MetadataRoute.Sitemap = [];
  
  try {
    // Verificar que no estemos en build time
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.log("Sitemap: Build time, retornando solo URLs base");
      return baseUrls;
    }

    if (!prisma) {
      console.warn("Sitemap: Prisma no disponible, retornando solo URLs base");
      return baseUrls;
    }

    // Productos con timeout para evitar que el sitemap se cuelgue
    try {
      const products = await Promise.race([
        prisma.product.findMany({
          select: {
            slug: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
        new Promise<[]>((resolve) => 
          setTimeout(() => {
            console.warn("Sitemap: Timeout obteniendo productos");
            resolve([]);
          }, 5000)
        ),
      ]) as Array<{ slug: string; updatedAt: Date | null }>;

      productUrls = products.map((product) => ({
        url: `${siteUrl}/products/${product.slug}`,
        lastModified: product.updatedAt || new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    } catch (productError) {
      console.error("Sitemap: Error obteniendo productos:", productError);
      // Continuar sin productos si hay error
    }

    // Categorías con timeout
    try {
      const categories = await Promise.race([
        prisma.category.findMany({
          select: {
            slug: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
        new Promise<[]>((resolve) => 
          setTimeout(() => {
            console.warn("Sitemap: Timeout obteniendo categorías");
            resolve([]);
          }, 5000)
        ),
      ]) as Array<{ slug: string; updatedAt: Date | null }>;

      categoryUrls = categories.map((category) => ({
        url: `${siteUrl}/products?cat=${category.slug}`,
        lastModified: category.updatedAt || new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    } catch (categoryError) {
      console.error("Sitemap: Error obteniendo categorías:", categoryError);
      // Continuar sin categorías si hay error
    }
  } catch (error) {
    console.error("Sitemap: Error general:", error);
    // Si hay error general, retornar al menos las URLs base
    return baseUrls;
  }

  // Siempre retornar al menos las URLs base, incluso si hay errores
  return [...baseUrls, ...productUrls, ...categoryUrls];
}

