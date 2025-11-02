import { PrismaClient } from "@prisma/client";
import { resolvePrismaDatabaseUrl } from "../lib/prisma-url";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: resolvePrismaDatabaseUrl(),
    },
  },
});

type Img = { url: string; alt?: string | null };

async function setImagesForProduct(
  slug: string,
  coverUrl: string,
  images: Img[]
) {
  // Busca el producto por slug (case-insensitive por si acaso)
  const product = await prisma.product.findFirst({
    where: { slug: { equals: slug, mode: "insensitive" } },
    select: { id: true },
  });

  if (!product) {
    console.warn(`⚠️  Producto con slug "${slug}" no encontrado, saltando.`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // 1) Portada
    await tx.product.update({
      where: { id: product.id },
      data: { imageUrl: coverUrl },
    });

    // 2) Miniaturas: elimina y vuelve a crear ordenadas
    await tx.productImage.deleteMany({ where: { productId: product.id } });

    if (images.length > 0) {
      await tx.productImage.createMany({
        data: images.map((img, idx) => ({
          productId: product.id,
          url: img.url,
          alt: img.alt ?? null,
          sortOrder: idx,
        })),
      });
    }
  });

  console.log(`✅ Imágenes actualizadas para "${slug}"`);
}

async function main() {
  // 👉 Reemplaza estas URLs por las tuyas si quieres
  await setImagesForProduct(
    "mouse-optico",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1400&auto=format&fit=crop&q=80",
    [
      {
        url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop&q=80",
        alt: "Mouse óptico 1",
      },
      {
        url: "https://images.unsplash.com/photo-1587202372775-98927b67c61b?w=1200&auto=format&fit=crop&q=80",
        alt: "Mouse óptico 2",
      },
    ]
  );

  await setImagesForProduct(
    "teclado-mecanico",
    "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1400&auto=format&fit=crop&q=80",
    [
      {
        url: "https://images.unsplash.com/photo-1514924510710-3019ce00f0b2?w=1200&auto=format&fit=crop&q=80",
        alt: "Teclado mecánico 1",
      },
      {
        url: "https://images.unsplash.com/photo-1516570161787-2fd917215a3d?w=1200&auto=format&fit=crop&q=80",
        alt: "Teclado mecánico 2",
      },
    ]
  );

  // Ejemplo adicional: mouse-rgb-pro
  await setImagesForProduct(
    "mouse-rgb-pro",
    "https://img.freepik.com/premium-photo/rgb-colorful-mouse_823919-2518.jpg",
    [
      {
        url: "https://img.freepik.com/premium-photo/rgb-colorful-mouse_823919-2518.jpg",
        alt: "Mouse RGB Pro 1",
      },
      {
        url: "https://img.freepik.com/premium-photo/rgb-colorful-mouse_823919-2518.jpg",
        alt: "Mouse RGB Pro 2",
      },
    ]
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
