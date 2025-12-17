import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-utils";
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

export async function POST(req: Request) {
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
    const slug = await resolveProductSlug(input.name, input.slug);
    const description =
      input.description && input.description.length > 0
        ? input.description
        : null;
    const gallery = (input.images ?? []).map((img, index) => ({
      url: img.url,
      alt: img.alt && img.alt.length > 0 ? img.alt : null,
      sortOrder: img.sortOrder ?? index,
    }));

    const created = await prisma.product.create({
      data: {
        name: input.name,
        slug,
        description,
        price: new Prisma.Decimal(input.price),
        stock: input.stock,
        imageUrl: input.imageUrl ?? null,
        categoryId: input.categoryId ?? null,
        isFeatured: input.isFeatured ?? false,
        images: gallery.length
          ? {
              create: gallery.map((img) => ({
                url: img.url,
                alt: img.alt ?? null,
                sortOrder: img.sortOrder,
              })),
            }
          : undefined,
      },
      include: adminProductInclude,
    });

    return NextResponse.json(toAdminProduct(created), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error", error);
    // No exponer detalles del error al cliente
    return NextResponse.json(
      { error: "Error al procesar la solicitud. Por favor intenta más tarde." },
      { status: 500 }
    );
  }
}
