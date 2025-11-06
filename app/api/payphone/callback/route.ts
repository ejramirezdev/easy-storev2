import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearCart, getOrCreateCart } from "@/lib/cart";
import axios from "axios";

// URL base de la API de Payphone
const getPayphoneApiUrl = () => {
  return "https://pay.payphonetodoesposible.com";
};

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clientTransactionId = searchParams.get("clientTransactionId");

    if (!id || !clientTransactionId) {
      console.error("Payphone callback: Parámetros faltantes", { id, clientTransactionId });
      return NextResponse.redirect(
        new URL(`/orders?error=missing_params`, req.url)
      );
    }

    // Buscar la orden por clientTransactionId (más preciso)
    let order = await prisma.order.findFirst({
      where: {
        payphoneClientTransactionId: clientTransactionId,
      },
      include: { user: true },
    });

    // Si no se encuentra por clientTransactionId, buscar por prefijo (compatibilidad con órdenes antiguas)
    if (!order) {
      const orderIdShort = clientTransactionId.replace(/-/g, '').substring(0, 8);
      const orders = await prisma.order.findMany({
        where: {
          id: {
            startsWith: orderIdShort,
          },
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      if (orders.length === 0) {
        console.error("Payphone callback: Orden no encontrada", { orderIdShort, clientTransactionId });
        return NextResponse.redirect(
          new URL(`/orders?error=order_not_found`, req.url)
        );
      }

      order = orders.find(o => o.status === "PENDING") || orders[0];
    }

    const orderId = order.id;
    
    // Guardar el transactionId de Payphone para referencia futura
    await prisma.order.update({
      where: { id: orderId },
      data: {
        payphoneTransactionId: id,
      },
    });

    // Verificar que la orden esté en estado PENDING
    if (order.status !== "PENDING") {
      if (order.status === "PAID") {
        return NextResponse.redirect(
          new URL(`/orders/${orderId}?payment=already_paid`, req.url)
        );
      }
      return NextResponse.redirect(
        new URL(`/orders/${orderId}?error=order_not_pending`, req.url)
      );
    }

    // Obtener configuración de Payphone
    const payphoneSettings = await prisma.payphoneSettings.findFirst();
    if (!payphoneSettings || !payphoneSettings.token || !payphoneSettings.storeId) {
      console.error("Payphone callback: Configuración no encontrada");
      return NextResponse.redirect(
        new URL(`/orders/${orderId}?error=config_error`, req.url)
      );
    }

    const apiUrl = getPayphoneApiUrl();
    const confirmEndpoint = `${apiUrl}/api/button/V2/Confirm`;

    // Confirmar el pago con Payphone usando axios
    let confirmationSuccess = false;
    let confirmData: any = null;

    try {
      // Limpiar el token: remover "Bearer " si está incluido
      const cleanToken = payphoneSettings.token.trim().replace(/^Bearer\s+/i, '');

      const confirmPayload = {
        id: parseInt(id, 10),
        clientTxId: clientTransactionId,
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

      confirmData = axiosResponse.data;

      // Verificar si la transacción fue aprobada
      if (axiosResponse.status >= 200 && axiosResponse.status < 300) {
        const statusCode = confirmData?.statusCode;
        const transactionStatus = confirmData?.transactionStatus;
        const isApproved = statusCode === 3 || transactionStatus === "Approved";

        if (isApproved) {
          confirmationSuccess = true;
          console.log("Payphone callback: ✅ Confirmación exitosa", {
            statusCode,
            transactionStatus,
            transactionId: confirmData.transactionId,
          });
        } else {
          console.error("Payphone callback: ❌ Transacción no aprobada", {
            statusCode,
            transactionStatus,
            message: confirmData.message,
          });
        }
      } else {
        console.error("Payphone callback: ❌ Error en respuesta", {
          status: axiosResponse.status,
          data: confirmData,
        });
      }
    } catch (apiError: any) {
      console.error("Payphone callback: ❌ Error al confirmar con Payphone:", apiError.message);
    }

    // Solo marcar como pagada si la confirmación fue exitosa
    if (confirmationSuccess) {
      const previousStatus = order.status;

          if (previousStatus === "PENDING") {
            await prisma.order.update({
              where: { id: orderId },
              data: {
                status: "PAID",
                payphoneConfirmedAt: new Date(),
              },
            });

        // Restar stock de los productos
        const { decrementOrderStock } = await import("@/lib/orders/stock");
        try {
          await decrementOrderStock(orderId, previousStatus);
        } catch (stockError: any) {
          console.error(`Error restando stock para orden ${orderId}:`, stockError);
        }

        // Limpiar el carrito después de un pago exitoso
        if (order.userId) {
          const { cart } = await getOrCreateCart(order.userId);
          if (cart && cart.id !== "empty") {
            await clearCart(cart.id);
          }
        }
      }

      return NextResponse.redirect(
        new URL(`/orders/${orderId}?payment=success`, req.url)
      );
    } else {
      // CONFIRMACIÓN FALLIDA - NO marcamos como pagada
      console.error("Payphone callback: ❌ CONFIRMACIÓN FALLIDA - NO marcando orden como pagada");
      return NextResponse.redirect(
        new URL(`/orders/${orderId}?error=confirmation_failed&critical=true&message=${encodeURIComponent("No se pudo confirmar el pago con Payphone. El pago fue procesado pero no se pudo confirmar. Si no se confirma en 5 minutos, Payphone reversará automáticamente. Por favor, contacta con soporte inmediatamente.")}`, req.url)
      );
    }
  } catch (error: any) {
    console.error("Error en callback de Payphone:", error);
    return NextResponse.redirect(
      new URL(`/orders?error=callback_error`, req.url)
    );
  }
}
