// app/products/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetailContent from "./ProductDetailContent";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw ?? "").trim();
  if (!slug) return {};

  try {
    if (!prisma) return {};

    const product = await prisma.product.findFirst({
      where: { slug: { equals: slug, mode: "insensitive" } },
      select: { name: true, description: true, imageUrl: true },
    }).catch(() => null);
    
    if (!product) return {};

    return {
      title: `${product.name} | Easy Store`,
      description: product.description ?? undefined,
      openGraph: {
        title: product.name,
        description: product.description ?? undefined,
        images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
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

    const product = await prisma.product.findFirst({
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
    }).catch(() => null);

    if (!product) notFound();

    return <ProductDetailContent product={product} showBackButton={true} />;
  } catch (error: any) {
    console.error("Error fetching product:", error?.message || error);
    notFound();
  }
}
