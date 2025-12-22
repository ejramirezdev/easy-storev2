import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-utils";
import { canManageCoupons } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { CouponInputSchema } from "@/lib/validation/coupons";

// PUT - Actualizar un cupón existente
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const isUserAdmin = await isAdmin(session.user.id);
    const canManage = await canManageCoupons(session.user.id);
    if (!isUserAdmin || !canManage) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const { id } = await params;
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

    // Verificar que el cupón existe
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    });
    if (!existingCoupon) {
      return NextResponse.json(
        { error: "Cupón no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el código no esté en uso por otro cupón
    if (data.code !== existingCoupon.code) {
      const codeExists = await prisma.coupon.findUnique({
        where: { code: data.code },
      });
      if (codeExists) {
        return NextResponse.json(
          { error: "Ya existe otro cupón con este código" },
          { status: 400 }
        );
      }
    }

    // Actualizar el cupón (no actualizamos usedCount desde aquí)
    const coupon = await prisma.coupon.update({
      where: { id },
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
        // usedCount se mantiene como está
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
    console.error("Error updating coupon:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe otro cupón con este código" },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Cupón no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar el cupón" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un cupón
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const isUserAdmin = await isAdmin(session.user.id);
    const canManage = await canManageCoupons(session.user.id);
    if (!isUserAdmin || !canManage) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que el cupón existe
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Cupón no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el cupón (las redemptions se eliminan en cascada debido a onDelete: Cascade)
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Cupón eliminado correctamente",
    });
  } catch (error: any) {
    console.error("Error deleting coupon:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Cupón no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Error al eliminar el cupón" },
      { status: 500 }
    );
  }
}

