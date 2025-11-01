export type ProductImageLike = {
  url: string | null;
};

export type ProductWithMaybeImages = {
  imageUrl?: string | null;
  images?: ProductImageLike[] | null;
} | null | undefined;

export function resolveProductImageUrl(product: ProductWithMaybeImages): string | null {
  if (!product) return null;
  const direct = typeof product.imageUrl === "string" ? product.imageUrl.trim() : "";
  if (direct.length > 0) {
    return product.imageUrl!.trim();
  }

  const gallery = Array.isArray(product.images) ? product.images : [];
  for (const image of gallery) {
    const candidate = typeof image?.url === "string" ? image.url.trim() : "";
    if (candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}
