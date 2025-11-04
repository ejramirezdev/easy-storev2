import ModalContainer from "@/components/modal/ModalContainer";
import UnlockOnMount from "@/components/common/UnlockOnMount";
import { PRODUCT_MODAL_LOCK_ID } from "@/lib/locks";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetailContent from "../../[slug]/ProductDetailContent";

export default async function ProductModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw ?? "").trim();
  if (!slug) notFound();

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
  });

  if (!product) notFound();

  return (
    <ModalContainer onClosePath="/products">
      <UnlockOnMount id={PRODUCT_MODAL_LOCK_ID} />
      <ProductDetailContent product={product} showBackButton={false} />
    </ModalContainer>
  );
}
