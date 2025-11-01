import ModalContainer from "@/components/modal/ModalContainer";
import UnlockOnMount from "@/components/common/UnlockOnMount";
import { PRODUCT_MODAL_LOCK_ID } from "@/lib/locks";
import ProductDetailPage from "../../[slug]/page"; // reuso del PDP (server)

export default async function ProductModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <ModalContainer onClosePath="/products">
      <UnlockOnMount id={PRODUCT_MODAL_LOCK_ID} /> {/* ✅ ahora acepta string */}
      {/* Reutilizamos PDP pasándole un Promise resuelto */}
      <ProductDetailPage params={Promise.resolve({ slug })} />
    </ModalContainer>
  );
}
