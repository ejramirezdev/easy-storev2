import { Product, ProductImage } from "@prisma/client";
import { AdminProduct } from "./types";
import { resolveProductImageUrl } from "./images";

export const adminProductInclude = {
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      url: true,
      alt: true,
      sortOrder: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const;

export function toAdminProduct(
  product: Product & {
    images: Pick<ProductImage, "id" | "url" | "alt" | "sortOrder">[];
    category?: { id: string; name: string; slug: string } | null;
  }
): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? null,
    price: Number(product.price),
    stock: product.stock,
    imageUrl: resolveProductImageUrl(product),
    images: (product.images ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? null,
      sortOrder: img.sortOrder ?? 0,
    })),
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
