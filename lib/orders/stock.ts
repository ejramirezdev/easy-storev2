import { prisma } from "@/lib/prisma";

/**
 * Resta stock de los productos de una orden
 * @param orderId - ID de la orden
 * @param previousStatus - Estado anterior de la orden (opcional, si no se proporciona se obtiene de la BD)
 */
export async function decrementOrderStock(
  orderId: string,
  previousStatus?: string
): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { productId: { not: null } },
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      console.warn(`Orden ${orderId} no encontrada para restar stock`);
      return;
    }

    // Si se proporciona previousStatus, usarlo; si no, usar el estado actual
    // Esto es útil cuando la orden ya fue actualizada pero necesitamos verificar el estado anterior
    const statusToCheck = previousStatus ?? order.status;

    // Solo restar stock si el estado anterior era PENDING (orden recién creada)
    // Si ya está en REVIEW o PAID, el stock ya fue restado
    if (statusToCheck !== "PENDING") {
      console.log(`Orden ${orderId} no está en PENDING (estado anterior: ${statusToCheck}), no se resta stock`);
      return;
    }

    // Restar stock de cada producto en la orden
    for (const item of order.items) {
      if (!item.productId) continue;

      try {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
        console.log(`Stock restado: Producto ${item.productId}, cantidad: ${item.quantity}`);
      } catch (error: any) {
        // Si el producto no existe o hay un error, logear pero continuar
        console.error(`Error restando stock del producto ${item.productId}:`, error);
      }
    }
  } catch (error: any) {
    console.error(`Error en decrementOrderStock para orden ${orderId}:`, error);
    throw error;
  }
}

/**
 * Restaura stock de los productos de una orden
 * Solo se restaura si el estado actual permite la restauración
 */
export async function restoreOrderStock(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { productId: { not: null } },
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      console.warn(`Orden ${orderId} no encontrada para restaurar stock`);
      return;
    }

    // Solo restaurar stock si el estado actual es REVIEW, PAID, SHIPPED, COMPLETED
    // Si es PENDING, el stock nunca se restó, así que no hay nada que restaurar
    // Si es CANCELED, ya se restauró el stock anteriormente
    const statesThatRestoreStock = ["REVIEW", "PAID", "SHIPPED", "COMPLETED"];
    if (!statesThatRestoreStock.includes(order.status)) {
      console.log(`Orden ${orderId} en estado ${order.status}, no se restaura stock`);
      return;
    }

    // Restaurar stock de cada producto en la orden
    for (const item of order.items) {
      if (!item.productId) continue;

      try {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
        console.log(`Stock restaurado: Producto ${item.productId}, cantidad: ${item.quantity}`);
      } catch (error: any) {
        // Si el producto no existe o hay un error, logear pero continuar
        console.error(`Error restaurando stock del producto ${item.productId}:`, error);
      }
    }
  } catch (error: any) {
    console.error(`Error en restoreOrderStock para orden ${orderId}:`, error);
    throw error;
  }
}

