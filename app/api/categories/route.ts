import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  CategoryInputSchema,
  type CategoryInput,
} from "@/lib/validation/categories";
import { resolveCategorySlug } from "@/lib/categories/slug.server";
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

  const name = input.name.trim();

  try {
    const slug = await resolveCategorySlug(name, input.slug);
    const created = await prisma.category.create({
      data: {
        name,
        slug,
      },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/categories error", error);
    return NextResponse.json(
      { error: error?.message ?? "No se pudo crear la categoría" },
      { status: 500 }
    );
  }
}
