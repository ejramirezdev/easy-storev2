import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { resolveProductImageUrl } from "@/lib/products/images";
import { ensureSessionUser } from "@/lib/session-user";

const payloadSchema = z.object({
  productId: z.string().uuid(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUser = await ensureSessionUser(session);
  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: sessionUser.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          stock: true,
          imageUrl: true,
          images: {
            select: { url: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  const items = favorites
    .filter((fav) => fav.product)
    .map((fav) => ({
      id: fav.id,
      createdAt: fav.createdAt,
      product: {
        id: fav.product!.id,
        name: fav.product!.name,
        slug: fav.product!.slug,
        description: fav.product!.description,
        price: Number(fav.product!.price),
        stock: fav.product!.stock ?? 0,
        imageUrl: resolveProductImageUrl({
          ...fav.product!,
          images: fav.product!.images,
        }),
      },
    }));

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = await ensureSessionUser(session);
  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const result = payloadSchema.safeParse(json);
  if (!result.success) {
    return NextResponse.json({ ok: false, error: "Producto inválido" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: result.data.productId },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ ok: false, error: "Producto no encontrado" }, { status: 404 });
  }

  await prisma.favorite.upsert({
    where: {
      userId_productId: {
        userId: sessionUser.id,
        productId: result.data.productId,
      },
    },
    create: {
      userId: sessionUser.id,
      productId: result.data.productId,
    },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = await ensureSessionUser(session);
  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ ok: false, error: "Producto inválido" }, { status: 400 });
  }

  await prisma.favorite.deleteMany({
    where: { userId: sessionUser.id, productId },
  });

  return NextResponse.json({ ok: true });
}
