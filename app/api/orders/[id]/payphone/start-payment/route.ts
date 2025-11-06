import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Guarda el clientTransactionId cuando se inicia un pago con Payphone
 * Esto nos permite rastrear y confirmar el pago dentro de 5 minutos
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const { id: orderId } = await context.params;
    const body = await req.json();
    const { clientTransactionId } = body as { clientTransactionId: string };

    if (!clientTransactionId) {
      return NextResponse.json(
        { ok: false, error: "clientTransactionId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la orden existe y pertenece al usuario
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 403 }
      );
    }

    // Guardar el clientTransactionId y la fecha de inicio del pago
    await prisma.order.update({
      where: { id: orderId },
      data: {
        payphoneClientTransactionId: clientTransactionId,
        payphonePaymentStartedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error guardando inicio de pago Payphone:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
