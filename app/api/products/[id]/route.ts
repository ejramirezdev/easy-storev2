import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-utils";
import { canDeleteProducts } from "@/lib/admin-permissions";
import {
  ProductInputSchema,
  type ProductInput,
} from "@/lib/validation/products";
import { resolveProductSlug } from "@/lib/products/slug.server";
import { adminProductInclude, toAdminProduct } from "@/lib/products/serialization";
import { ZodError } from "zod";
import { deleteProductImagesFromS3, deleteFromS3, isS3Url } from "@/lib/s3";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const productId = rawId?.trim();
  if (!productId) {
    return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorized();
  }

  const isUserAdmin = await isAdmin(session.user.id);
  if (!isUserAdmin) {
    return unauthorized();
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  let input: ProductInput;
  try {
    input = ProductInputSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          issues: error.issues,
        },
        { status: 422 }
      );
    }
    throw error;
  }

  try {
    // Obtener el producto actual con sus imágenes ANTES de actualizar
    // para detectar qué imágenes se eliminaron y borrarlas de S3
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
      },
    });

    if (!currentProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const slug = await resolveProductSlug(input.name, input.slug, productId);
    const description =
      input.description && input.description.length > 0
        ? input.description
        : null;
    const gallery = (input.images ?? []).map((img, index) => ({
      id: img.id,
      url: img.url,
      alt: img.alt && img.alt.length > 0 ? img.alt : null,
      sortOrder: img.sortOrder ?? index,
    }));

    const persisted = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name: input.name,
          slug,
          description,
          price: new Prisma.Decimal(input.price),
          stock: input.stock,
          imageUrl: input.imageUrl ?? null,
          categoryId: input.categoryId ?? null,
          isFeatured: input.isFeatured ?? false,
        },
      });

      const idsToKeep = gallery
        .filter((img) => !!img.id)
        .map((img) => img.id!)
        .filter(Boolean);

      if (gallery.length === 0) {
        await tx.productImage.deleteMany({ where: { productId } });
      } else if (idsToKeep.length === 0) {
        await tx.productImage.deleteMany({ where: { productId } });
      } else {
        await tx.productImage.deleteMany({
          where: {
            productId,
            id: { notIn: idsToKeep },
          },
        });
      }

      // Nota: La eliminación de imágenes de S3 se hará DESPUÉS de la transacción

      for (let index = 0; index < gallery.length; index += 1) {
        const img = gallery[index];
        const sortOrder = img.sortOrder ?? index;
        if (img.id) {
          await tx.productImage.update({
            where: { id: img.id },
            data: {
              url: img.url,
              alt: img.alt,
              sortOrder,
            },
          });
        } else {
          await tx.productImage.create({
            data: {
              productId,
              url: img.url,
              alt: img.alt,
              sortOrder,
            },
          });
        }
      }

      const full = await tx.product.findUnique({
        where: { id: productId },
        include: adminProductInclude,
      });

      if (!full) {
        throw new Error("Producto no encontrado después de actualizar");
      }

      return full;
    });

    // Después de la transacción exitosa, eliminar imágenes de S3 que ya no se usan
    // Verificar si la imagen principal cambió
    const oldMainImageUrl = currentProduct.imageUrl;
    const newMainImageUrl = input.imageUrl ?? null;
    
    // Identificar todas las imágenes que se deben eliminar de S3
    const imagesToDeleteFromS3: string[] = [];
    
    // Imágenes de galería eliminadas
    const idsToKeep = gallery
      .filter((img) => !!img.id)
      .map((img) => img.id!)
      .filter(Boolean);
    
    const deletedGalleryImages = currentProduct.images.filter(
      (img) => gallery.length === 0 || idsToKeep.length === 0 || !idsToKeep.includes(img.id)
    );
    
    deletedGalleryImages.forEach((img) => {
      if (isS3Url(img.url)) {
        imagesToDeleteFromS3.push(img.url);
      }
    });
    
    // Si la imagen principal cambió y la anterior era de S3, eliminarla
    if (oldMainImageUrl && oldMainImageUrl !== newMainImageUrl && isS3Url(oldMainImageUrl)) {
      imagesToDeleteFromS3.push(oldMainImageUrl);
    }
    
    // Eliminar imágenes de S3 en paralelo (no esperar, para no bloquear la respuesta)
    if (imagesToDeleteFromS3.length > 0) {
      Promise.all(imagesToDeleteFromS3.map(url => deleteFromS3(url)))
        .then(() => {
          console.log(`Eliminadas ${imagesToDeleteFromS3.length} imágenes de S3 después de actualizar producto ${productId}`);
        })
        .catch((error) => {
          console.error("Error eliminando imágenes de S3 después de actualizar:", error);
        });
    }

    return NextResponse.json(toAdminProduct(persisted));
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 404 }
        );
      }
    }

    console.error(`PUT /api/products/${productId} error`, error);
    // No exponer detalles del error al cliente
    return NextResponse.json(
      { error: "Error al procesar la solicitud. Por favor intenta más tarde." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const productId = rawId?.trim();
  if (!productId) {
    return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorized();
  }

  const isUserAdmin = await isAdmin(session.user.id);
  const canDelete = await canDeleteProducts(session.user.id);
  if (!isUserAdmin || !canDelete) {
    return unauthorized();
  }

  try {
    // Obtener el producto con sus imágenes antes de eliminarlo
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar todas las imágenes de S3 antes de eliminar el producto
    const galleryUrls = product.images.map((img) => img.url);
    console.log(`Eliminando imágenes de S3 para producto ${productId}:`, {
      mainImage: product.imageUrl,
      galleryImages: galleryUrls.length,
    });
    await deleteProductImagesFromS3(product.imageUrl, galleryUrls);
    console.log(`Imágenes de S3 eliminadas para producto ${productId}`);

    // Eliminar todas las referencias al producto antes de eliminarlo
    // Esto evita violaciones de foreign key constraint
    await prisma.$transaction(async (tx) => {
      // Eliminar items del carrito que referencian este producto
      await tx.cartItem.deleteMany({
        where: { productId },
      });

      // Eliminar favoritos que referencian este producto
      await tx.favorite.deleteMany({
        where: { productId },
      });

      // Eliminar items de órdenes que referencian este producto
      // Nota: OrderItem tiene onDelete sin cascade explícito, pero eliminamos por seguridad
      await tx.orderItem.deleteMany({
        where: { productId },
      });

      // Eliminar el producto (las ProductImage se eliminarán automáticamente por cascada)
      await tx.product.delete({ where: { id: productId } });
    });
    
    return NextResponse.json({ success: true, id: productId });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 404 }
        );
      }
    }

    console.error(`DELETE /api/products/${productId} error`, error);
    return NextResponse.json(
      { error: error?.message ?? "No se pudo eliminar el producto" },
      { status: 500 }
    );
  }
}
