import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAdminEmail } from "@/lib/admin";
import {
  ProductInputSchema,
  type ProductInput,
} from "@/lib/validation/products";
import { resolveProductSlug } from "@/lib/products/slug.server";
import { adminProductInclude, toAdminProduct } from "@/lib/products/serialization";
import { ZodError } from "zod";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const productId = params.id;
  if (!productId) {
    return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email ?? null)) {
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
    return NextResponse.json(
      { error: error?.message ?? "No se pudo actualizar el producto" },
      { status: 500 }
    );
  }
}
