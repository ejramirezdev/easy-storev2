import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-utils";
import { prisma } from "@/lib/prisma";
import { CouponInputSchema } from "@/lib/validation/coupons";

// GET - Listar todos los cupones
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    return NextResponse.json({
      coupons: coupons.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        minSubtotal: coupon.minSubtotal ? Number(coupon.minSubtotal) : null,
        startsAt: coupon.startsAt?.toISOString() ?? null,
        endsAt: coupon.endsAt?.toISOString() ?? null,
        maxUses: coupon.maxUses,
        perUserLimit: coupon.perUserLimit,
        usedCount: coupon.usedCount,
        actualUses: coupon._count.redemptions, // Contador real de redemptions
        isActive: coupon.isActive,
        createdAt: coupon.createdAt.toISOString(),
        updatedAt: coupon.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Error al cargar los cupones" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo cupón
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validar el input
    const validationResult = CouponInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verificar que el código no exista
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: data.code },
    });
    if (existingCoupon) {
      return NextResponse.json(
        { error: "Ya existe un cupón con este código" },
        { status: 400 }
      );
    }

    // Crear el cupón
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        minSubtotal: data.minSubtotal ?? null,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        maxUses: data.maxUses ?? null,
        perUserLimit: data.perUserLimit ?? null,
        isActive: data.isActive ?? true,
        usedCount: 0,
      },
    });

    return NextResponse.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        minSubtotal: coupon.minSubtotal ? Number(coupon.minSubtotal) : null,
        startsAt: coupon.startsAt?.toISOString() ?? null,
        endsAt: coupon.endsAt?.toISOString() ?? null,
        maxUses: coupon.maxUses,
        perUserLimit: coupon.perUserLimit,
        usedCount: coupon.usedCount,
        isActive: coupon.isActive,
        createdAt: coupon.createdAt.toISOString(),
        updatedAt: coupon.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un cupón con este código" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear el cupón" },
      { status: 500 }
    );
  }
}

