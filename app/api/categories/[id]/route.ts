import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-utils";
import { prisma } from "@/lib/prisma";
import {
  CategoryInputSchema,
  type CategoryInput,
} from "@/lib/validation/categories";
import { resolveCategorySlug } from "@/lib/categories/slug.server";
import { ZodError } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

// PUT - Actualizar categoría
export async function PUT(req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email ?? null)) {
    return unauthorized();
  }

  const { id } = await context.params;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  let input: CategoryInput;
  try {
    input = CategoryInputSchema.parse(payload);
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

  // Verificar que la categoría existe
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Categoría no encontrada" },
      { status: 404 }
    );
  }

  const name = input.name.trim();

  try {
    // Si el nombre cambió, generar nuevo slug
    const slug =
      name !== existing.name
        ? await resolveCategorySlug(name, input.slug)
        : existing.slug;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
      },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/categories/[id] error", error);
    
    // Si es un error de slug duplicado
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre o slug" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar la categoría" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar categoría
export async function DELETE(req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email ?? null)) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    // Verificar que la categoría existe
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si tiene productos asociados
    if (existing.products.length > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar la categoría porque tiene productos asociados",
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/categories/[id] error", error);
    return NextResponse.json(
      { error: "Error al eliminar la categoría" },
      { status: 500 }
    );
  }
}

