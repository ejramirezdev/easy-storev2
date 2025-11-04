import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearCart, getOrCreateCart } from "@/lib/cart";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string | undefined;
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 }
    );
  }

  const { id: orderId } = await context.params;
  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: "Orden inválida" },
      { status: 400 }
    );
  }

  let payload: unknown;
  try {
    const json = await req.json();
    payload = json?.payload ?? json;
  } catch {
    payload = null;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Orden no encontrada" },
      { status: 404 }
    );
  }
  if (order.userId !== userId) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 403 }
    );
  }

  // Extraer estado desde la respuesta de Paybox si viene con forma conocida
  const status = getStatusFromPaybox(payload);
  if (status !== "succeeded") {
    return NextResponse.json(
      { ok: false, error: "Pago no exitoso o respuesta inválida" },
      { status: 400 }
    );
  }

  // Marcar orden como pagada y (opcional) guardar metadatos en una tabla futura
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID" },
  });

  // Limpiar el carrito después de un pago exitoso
  const { cart } = await getOrCreateCart(userId);
  if (cart && cart.id !== "empty") {
    await clearCart(cart.id);
  }

  return NextResponse.json({ ok: true });
}

function getStatusFromPaybox(payload: any): string | null {
  if (!payload || typeof payload !== "object") return null;
  // Soportar formatos comunes del SDK (response.status)
  if (typeof payload.status === "string") return payload.status.toLowerCase();
  // Aceptar anidados: payload.response.status
  if (payload.response && typeof payload.response.status === "string")
    return payload.response.status.toLowerCase();
  return null;
}
