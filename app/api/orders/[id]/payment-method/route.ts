import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { paymentMethod, selectedBank } = body as {
      paymentMethod?: "CARD" | "BANK_TRANSFER";
      selectedBank?: string;
    };

    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Verificar que el usuario sea el dueño de la orden o admin
    if (order.userId !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    // Actualizar el método de pago y/o banco
    const updateData: {
      paymentMethod?: string;
      selectedBank?: string;
    } = {};

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    if (selectedBank) {
      updateData.selectedBank = selectedBank;
    }

    await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el método de pago" },
      { status: 500 }
    );
  }
}
