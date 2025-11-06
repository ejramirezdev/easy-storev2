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

    // Obtener el estado anterior de la orden
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const previousStatus = currentOrder.status;
    const newStatus = status as any;

    // Si el estado cambia a CANCELED, restaurar el stock
    if (newStatus === "CANCELED" && previousStatus !== "CANCELED") {
      const { restoreOrderStock } = await import("@/lib/orders/stock");
      try {
        await restoreOrderStock(id);
      } catch (stockError: any) {
        // Log el error pero no fallar la actualización de la orden
        console.error(`Error restaurando stock para orden ${id}:`, stockError);
      }
    }

    // Si el estado cambia de PENDING a REVIEW o PAID, restar stock
    if (previousStatus === "PENDING" && (newStatus === "REVIEW" || newStatus === "PAID")) {
      const { decrementOrderStock } = await import("@/lib/orders/stock");
      try {
        await decrementOrderStock(id);
      } catch (stockError: any) {
        // Log el error pero no fallar la actualización de la orden
        console.error(`Error restando stock para orden ${id}:`, stockError);
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: newStatus },
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

    // Obtener la orden para verificar si tiene un comprobante en S3 y restaurar stock
    const order = await prisma.order.findUnique({
      where: { id },
      select: { receiptUrl: true, status: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Restaurar stock antes de eliminar la orden
    const { restoreOrderStock } = await import("@/lib/orders/stock");
    try {
      await restoreOrderStock(id);
    } catch (stockError: any) {
      // Log el error pero no fallar la eliminación de la orden
      console.error(`Error restaurando stock para orden ${id}:`, stockError);
    }

    // Eliminar el comprobante de S3 si existe
    if (order.receiptUrl) {
      const { deleteFromS3 } = await import("@/lib/s3");
      try {
        await deleteFromS3(order.receiptUrl);
        console.log(`Comprobante eliminado de S3 para orden ${id}`);
      } catch (s3Error: any) {
        // Log el error pero no fallar la eliminación de la orden
        console.error(`Error eliminando comprobante de S3 (orden ${id}):`, s3Error);
      }
    }

    // Eliminar la orden de la base de datos
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
