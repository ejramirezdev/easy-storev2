import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status } = body as { status?: string };

    if (!status) {
      return NextResponse.json(
        { error: "El estado es requerido" },
        { status: 400 }
      );
    }

    // Validar que el estado sea válido
    const validStatuses = [
      "PENDING",
      "REVIEW",
      "PAID",
      "SHIPPED",
      "COMPLETED",
      "CANCELED",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: {
          include: {
            product: { select: { name: true } },
            service: { select: { name: true } },
          },
        },
        addresses: true,
      },
    });

    return NextResponse.json({ ok: true, order });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar la orden" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

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
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar la orden" },
      { status: 500 }
    );
  }
}
