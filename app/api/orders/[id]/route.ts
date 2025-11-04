import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea el dueño de la orden
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Solo permitir cancelar órdenes en estado PENDING
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Solo se pueden cancelar órdenes en estado 'Orden Creada'" },
        { status: 400 }
      );
    }

    // Eliminar la orden (esto también eliminará los items y direcciones por cascade)
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }
    console.error("Error canceling order:", error);
    return NextResponse.json(
      { error: error.message || "Error al cancelar la orden" },
      { status: 500 }
    );
  }
}
