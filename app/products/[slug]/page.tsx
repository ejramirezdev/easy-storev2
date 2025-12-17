// app/products/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetailContent from "./ProductDetailContent";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw ?? "").trim();
  if (!slug) return {};

  try {
    if (!prisma) return {};

    const product = await prisma.product
      .findFirst({
        where: { slug: { equals: slug, mode: "insensitive" } },
        select: {
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          stock: true,
          category: { select: { name: true } },
        },
      })
      .catch(() => null);

    if (!product) return {};

    const productUrl = `${siteUrl}/products/${slug}`;
    const productImage = product.imageUrl || `${siteUrl}/placeholder.jpg`;
    const price = Number(product.price);
    const priceFormatted = `$${price.toFixed(2)}`;
    const productDescription =
      product.description ||
      `${product.name} - Disponible en Easy Store Ecuador`;
    // Descripción para Open Graph que incluye el precio
    const ogDescription = `${productDescription} | Precio: ${priceFormatted}${
      product.stock > 0 ? " | En stock" : " | Agotado"
    }`;

    return {
      title: `${product.name} | Easy Store`,
      description: productDescription,
      keywords: [
        product.name,
        product.category?.name || "producto tecnológico",
        "Ecuador",
        "gadgets",
        "tecnología",
      ],
      openGraph: {
        type: "website",
        title: product.name,
        description: ogDescription, // Incluye precio en la descripción
        url: productUrl,
        images: [
          {
            // Generar imagen OG dinámica con precio, o usar imagen del producto como fallback
            url: `${siteUrl}/api/og-image?type=product&name=${encodeURIComponent(
              product.name
            )}&price=${encodeURIComponent(priceFormatted)}${
              productImage ? `&image=${encodeURIComponent(productImage)}` : ""
            }`,
            width: 1200,
            height: 630,
            alt: product.name,
          },
          // Fallback: imagen del producto
          {
            url: productImage,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description: ogDescription, // Incluye precio en la descripción
        images: [productImage],
      },
      alternates: {
        canonical: productUrl,
      },
    };
  } catch (error: any) {
    // Si hay error, retornar metadata por defecto
    return {};
  }
}

// Página principal (solo acepta params)
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw ?? "").trim();
  if (!slug) notFound();

  try {
    if (!prisma) {
      notFound();
    }

    const product = await prisma.product
      .findFirst({
        where: { slug: { equals: slug, mode: "insensitive" } },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          stock: true,
          imageUrl: true,
          images: {
            select: { id: true, url: true, alt: true, sortOrder: true },
            orderBy: { sortOrder: "asc" },
          },
          category: { select: { name: true, slug: true } },
          createdAt: true,
        },
      })
      .catch(() => null);

    if (!product) notFound();

    return <ProductDetailContent product={product} showBackButton={true} />;
  } catch (error: any) {
    console.error("Error fetching product:", error?.message || error);
    notFound();
  }
}
