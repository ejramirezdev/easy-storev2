import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

const getPayphoneApiUrl = () => {
  return "https://pay.payphonetodoesposible.com";
};

/**
 * Endpoint para confirmar pagos pendientes de Payphone que no fueron confirmados en el callback
 * Debe ejecutarse periódicamente (cada 1-2 minutos) para verificar órdenes con pagos iniciados
 * hace menos de 5 minutos y que aún no han sido confirmados
 * 
 * Uso:
 * - Cron job: GET /api/payphone/confirm-pending?secret=<SECRET_KEY>
 * - O desde el dashboard admin
 */
export async function GET(req: NextRequest) {
  try {
    // Validar secret key (opcional, para seguridad)
    const secret = req.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.PAYPHONE_CONFIRM_SECRET;
    
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener configuración de Payphone
    const payphoneSettings = await prisma.payphoneSettings.findFirst();
    if (!payphoneSettings || !payphoneSettings.token || !payphoneSettings.storeId) {
      return NextResponse.json(
        { ok: false, error: "Configuración de Payphone no encontrada" },
        { status: 500 }
      );
    }

    const apiUrl = getPayphoneApiUrl();
    const confirmEndpoint = `${apiUrl}/api/button/V2/Confirm`;
    const cleanToken = payphoneSettings.token.trim().replace(/^Bearer\s+/i, '');

    // Buscar órdenes con pagos iniciados hace menos de 5 minutos que aún no han sido confirmados
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const now = new Date();

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        paymentMethod: "CARD", // Solo órdenes pagadas con tarjeta (Payphone)
        payphoneClientTransactionId: { not: null },
        payphonePaymentStartedAt: {
          gte: fiveMinutesAgo,
          lte: now,
        },
        payphoneConfirmedAt: null, // Aún no confirmadas
      },
      take: 50, // Limitar a 50 órdenes por ejecución
    });

    console.log(`Payphone confirm-pending: Encontradas ${pendingOrders.length} órdenes pendientes de confirmar`);

    const results = {
      total: pendingOrders.length,
      confirmed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const order of pendingOrders) {
      if (!order.payphoneClientTransactionId) continue;

      try {
        // Verificar si tenemos el transactionId (solo si ya llegó el callback pero falló la confirmación)
        // Si no tenemos transactionId, no podemos confirmar aún (el callback no ha llegado)
        if (!order.payphoneTransactionId) {
          console.log(`Payphone confirm-pending: Orden ${order.id} aún no tiene transactionId, esperando callback...`);
          continue;
        }

        const confirmPayload = {
          id: parseInt(order.payphoneTransactionId, 10),
          clientTxId: order.payphoneClientTransactionId,
        };

        const axiosResponse = await axios.post(confirmEndpoint, confirmPayload, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cleanToken}`,
          },
          transformRequest: [(data) => JSON.stringify(data)],
          timeout: 30000,
          validateStatus: (status) => status < 600,
          maxRedirects: 0,
          httpAgent: false,
          httpsAgent: false,
        });

        const confirmData = axiosResponse.data;

        // Verificar si la transacción fue aprobada
        if (axiosResponse.status >= 200 && axiosResponse.status < 300) {
          const statusCode = confirmData?.statusCode;
          const transactionStatus = confirmData?.transactionStatus;
          const isApproved = statusCode === 3 || transactionStatus === "Approved";

          if (isApproved) {
            // Confirmación exitosa
            const previousStatus = order.status;

            if (previousStatus === "PENDING") {
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  status: "PAID",
                  payphoneConfirmedAt: new Date(),
                },
              });

              // Restar stock de los productos
              const { decrementOrderStock } = await import("@/lib/orders/stock");
              try {
                await decrementOrderStock(order.id, previousStatus);
              } catch (stockError: any) {
                console.error(`Error restando stock para orden ${order.id}:`, stockError);
              }

              // Limpiar el carrito
              if (order.userId) {
                const { getOrCreateCart, clearCart } = await import("@/lib/cart");
                const { cart } = await getOrCreateCart(order.userId);
                if (cart && cart.id !== "empty") {
                  await clearCart(cart.id);
                }
              }
            }

            results.confirmed++;
            console.log(`Payphone confirm-pending: ✅ Orden ${order.id} confirmada exitosamente`);
          } else {
            results.failed++;
            results.errors.push(`Orden ${order.id}: Transacción no aprobada (${statusCode || transactionStatus})`);
            console.error(`Payphone confirm-pending: ❌ Orden ${order.id} no aprobada`, {
              statusCode,
              transactionStatus,
            });
          }
        } else {
          results.failed++;
          results.errors.push(`Orden ${order.id}: Error ${axiosResponse.status}`);
          console.error(`Payphone confirm-pending: ❌ Orden ${order.id} error`, {
            status: axiosResponse.status,
            data: confirmData,
          });
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Orden ${order.id}: ${error.message}`);
        console.error(`Payphone confirm-pending: ❌ Error confirmando orden ${order.id}:`, error.message);
      }
    }

    return NextResponse.json({
      ok: true,
      results,
      message: `Procesadas ${results.total} órdenes: ${results.confirmed} confirmadas, ${results.failed} fallidas`,
    });
  } catch (error: any) {
    console.error("Error en confirm-pending:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}

