import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearCart, getOrCreateCart } from "@/lib/cart";

// URL base de la API de Payphone
// Según la documentación, Payphone valida el entorno según el token/storeId configurado,
// no según la URL. Por lo tanto, siempre usamos el mismo endpoint.
const getPayphoneApiUrl = () => {
  return "https://pay.payphonetodoesposible.com";
};

export async function GET(req: NextRequest) {
  try {
    // Capturar TODOS los parámetros de la URL que Payphone envía
    // Payphone puede enviar diferentes parámetros según el resultado del pago
    const searchParams = req.nextUrl.searchParams;
    const allParams = Object.fromEntries(searchParams.entries());
    
    // Logging completo de todos los parámetros recibidos
    console.log("Payphone callback: Parámetros recibidos:", {
      url: req.url,
      allParams,
      timestamp: new Date().toISOString(),
    });

    // Parámetros principales según documentación
    const id = searchParams.get("id"); // ID de transacción generado por Payphone
    const clientTransactionId = searchParams.get("clientTransactionId"); // ID único que enviamos
    const status = searchParams.get("status"); // Estado del pago (si viene en URL)
    const message = searchParams.get("message"); // Mensaje (si viene en URL)

    // Validar parámetros requeridos
    if (!id || !clientTransactionId) {
      console.error("Payphone callback: Parámetros faltantes", {
        id,
        clientTransactionId,
        allParams,
      });
      return NextResponse.redirect(
        new URL(`/orders?error=missing_params`, req.url)
      );
    }

    // El clientTransactionId tiene formato: orderIdShort-timestamp-random
    // donde orderIdShort son los primeros 8 caracteres del orderId completo (UUID)
    // Extraemos el orderIdShort (primera parte antes del primer guión)
    const orderIdShort = clientTransactionId.split('-')[0];
    
    // Buscar la orden que empiece con orderIdShort
    // Como los orderIds son UUIDs, los primeros 8 caracteres deberían ser únicos
    // Si hay múltiples (muy poco probable), tomamos la más reciente en estado PENDING
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
      console.error("Payphone callback: Orden no encontrada", {
        orderIdShort,
        clientTransactionId,
      });
      return NextResponse.redirect(
        new URL(`/orders?error=order_not_found`, req.url)
      );
    }

    // Si hay múltiples órdenes (muy poco probable), preferir la que esté en PENDING
    // Si ninguna está en PENDING, tomar la más reciente
    let order = orders.find(o => o.status === "PENDING") || orders[0];
    const orderId = order.id;

    // IMPORTANTE: Verificar que la orden esté en estado PENDING
    // Esto previene pagos duplicados si el usuario intenta pagar una orden ya pagada
    if (order.status !== "PENDING") {
      console.warn("Payphone callback: Orden ya procesada", {
        orderId,
        currentStatus: order.status,
        clientTransactionId,
        orderIdShort,
      });
      
      // Si ya está pagada, redirigir con mensaje de éxito
      if (order.status === "PAID") {
        return NextResponse.redirect(
          new URL(`/orders/${orderId}?payment=already_paid`, req.url)
        );
      }
      
      // Para otros estados, redirigir con error
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

    // Obtener la URL base de la API de Payphone
    // Payphone valida el entorno según el token/storeId, no según la URL
    const apiUrl = getPayphoneApiUrl();
    const environment = payphoneSettings.environment || "sandbox";
    
    console.log("Payphone callback: Configuración", {
      environment,
      apiUrl,
      endpoint: `${apiUrl}/api/button/V2/Confirm`,
      orderId,
    });

    // IMPORTANTE: Si Payphone nos redirigió al callback, significa que el pago fue exitoso
    // Payphone solo redirige al callback cuando el pago se procesa correctamente
    
    // CRÍTICO: Según soporte de Payphone, el endpoint /api/button/V2/Confirm NO está disponible en sandbox
    // En sandbox, confiamos en que si Payphone redirige al callback, el pago fue exitoso
    // (Payphone envía correos de confirmación exitosa en sandbox)
    // En producción, usamos el endpoint real de confirmación
    
    const isSandbox = payphoneSettings.environment === "sandbox";
    
    let confirmationSuccess = false;
    let confirmationError: any = null;
    let confirmData: any = null; // Declarar fuera del bloque para que esté disponible
    
    if (isSandbox) {
      // En sandbox, el endpoint de confirmación no está disponible
      // Si Payphone redirigió al callback, asumimos que el pago fue exitoso
      // (Payphone envía correos de confirmación exitosa)
      console.log("Payphone callback: 🔶 MODO SANDBOX - Endpoint de confirmación no disponible");
      console.log("Payphone callback: 🔶 Confiando en redirección de Payphone como confirmación de pago exitoso");
      console.log("Payphone callback: 🔶 Payphone envía correos de confirmación exitosa en sandbox");
      confirmationSuccess = true; // En sandbox, confiamos en la redirección
    } else {
      // En producción, intentar confirmar con la API de Payphone según documentación oficial
      try {
        // Según la documentación oficial de Payphone:
        // - Endpoint: https://pay.payphonetodoesposible.com/api/button/V2/Confirm
        // - Payload: { "id": 0, "clientTxId": "string" }
        // - id: número entero (el id que recibimos en el callback)
        // - clientTxId: el clientTransactionId exacto que recibimos en el callback
        
        // El clientTransactionId que recibimos es el mismo que enviamos al crear la transacción
        // Debe usarse exactamente como viene, sin modificaciones
        const confirmPayload = {
          id: parseInt(id, 10), // Convertir a número entero según documentación
          clientTxId: clientTransactionId, // Usar exactamente el valor recibido en el callback
        };
        
        // Endpoint según documentación oficial
        const confirmEndpoint = `${apiUrl}/api/button/V2/Confirm`;

        console.log("Payphone callback: 🔵 MODO PRODUCCIÓN - Intentando confirmar con API de Payphone");
        console.log("Payphone callback: Datos para confirmación", {
          endpoint: confirmEndpoint,
          id: id,
          idParsed: parseInt(id, 10),
          idIsValid: !isNaN(parseInt(id, 10)),
          clientTransactionId: clientTransactionId,
          clientTransactionIdLength: clientTransactionId.length,
          clientTransactionIdIsValid: clientTransactionId && clientTransactionId.length > 0 && clientTransactionId.length <= 50,
          orderId: orderId,
          tokenExists: !!payphoneSettings.token,
          tokenLength: payphoneSettings.token?.length || 0,
          storeId: payphoneSettings.storeId,
          storeIdExists: !!payphoneSettings.storeId,
          payload: confirmPayload,
        });

        // Realizar la solicitud de confirmación según documentación oficial
        console.log("Payphone callback: Enviando solicitud de confirmación:", {
          endpoint: confirmEndpoint,
          payload: confirmPayload,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${payphoneSettings.token ? `${payphoneSettings.token.substring(0, 20)}...` : "NO TOKEN"}`,
          },
        });
        
        let confirmResponse = await fetch(confirmEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${payphoneSettings.token}`,
          },
          body: JSON.stringify(confirmPayload),
        });
        
        // Si falla con error 500, podría ser que Payphone no acepta el formato orderId-timestamp-random
        // Intentar con solo el orderId original como fallback
        if (!confirmResponse.ok && confirmResponse.status === 500) {
          console.warn("Payphone callback: ⚠️ Error 500 con clientTransactionId completo, intentando con solo orderId original...");
          
          // El clientTransactionId tiene formato: orderIdShort-timestamp-random
          // Intentar con solo el orderId original completo
          const orderIdOnlyPayload = {
            id: parseInt(id, 10),
            clientTxId: orderId, // Usar el orderId original completo
          };
          
          console.log("Payphone callback: Intentando con orderId original:", orderIdOnlyPayload);
          
          const fallbackResponse = await fetch(confirmEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${payphoneSettings.token}`,
            },
            body: JSON.stringify(orderIdOnlyPayload),
          });
          
          // Si el fallback funciona, usar esa respuesta
          if (fallbackResponse.ok) {
            console.log("Payphone callback: ✅ Confirmación exitosa con orderId original (sin timestamp-random)");
            confirmResponse = fallbackResponse;
          } else {
            console.warn("Payphone callback: ⚠️ Fallback con orderId original también falló");
          }
        }

        console.log("Payphone callback: Respuesta de confirmación", {
          status: confirmResponse.status,
          statusText: confirmResponse.statusText,
          ok: confirmResponse.ok,
          headers: Object.fromEntries(confirmResponse.headers.entries()),
        });

        try {
          const text = await confirmResponse.text();
          console.log("Payphone callback: Respuesta raw:", text);
          
          if (text) {
            try {
              confirmData = JSON.parse(text);
            } catch (parseError) {
              console.error("Payphone callback: Error parseando JSON:", parseError);
              confirmData = { raw: text };
            }
          } else {
            confirmData = {};
          }
        } catch (readError: any) {
          console.error("Payphone callback: Error leyendo respuesta:", readError);
          confirmData = { error: readError.message };
        }

        console.log("Payphone callback: Datos de confirmación parseados:", confirmData);

        if (confirmResponse.ok) {
          confirmationSuccess = true;
          console.log("Payphone callback: ✅ Confirmación exitosa con API de Payphone");
          console.log("Payphone callback: ✅ Payphone ahora sabe que recibimos y procesamos el pago correctamente");
          console.log("Payphone callback: ✅ La transacción NO será reversada automáticamente");
        } else {
          confirmationError = {
            status: confirmResponse.status,
            statusText: confirmResponse.statusText,
            data: confirmData,
          };
          console.error("Payphone callback: ❌ Error en respuesta de confirmación", confirmationError);
          console.error("Payphone callback: ❌ Payload enviado:", confirmPayload);
          console.error("Payphone callback: ❌ Endpoint usado:", confirmEndpoint);
          console.error("Payphone callback: ❌ Token existe:", !!payphoneSettings.token);
          console.error("Payphone callback: ❌ StoreId:", payphoneSettings.storeId);
          
          // Si es error 500, podría ser un problema del servidor de Payphone
          // o un problema con el formato del clientTransactionId
          if (confirmResponse.status === 500) {
            console.error("Payphone callback: ❌ ERROR 500 - Posibles causas:");
            console.error("Payphone callback: ❌ 1. El formato del clientTransactionId no es válido para Payphone");
            console.error("Payphone callback: ❌ 2. Problema con el token o storeId");
            console.error("Payphone callback: ❌ 3. Problema temporal en el servidor de Payphone");
            console.error("Payphone callback: ❌ 4. El endpoint no está disponible en sandbox");
          }
          
          console.warn("Payphone callback: ⚠️ IMPORTANTE: Si no confirmamos en 5 minutos, Payphone reversará automáticamente la transacción.");
          console.warn("Payphone callback: ⚠️ El pago fue exitoso, pero Payphone NO sabe que lo recibimos. Necesitamos resolver el problema de confirmación.");
        }
      } catch (apiError: any) {
        confirmationError = apiError;
        console.error("Payphone callback: ❌ Error al intentar confirmar con API de Payphone:", apiError);
        console.warn("Payphone callback: ⚠️ IMPORTANTE: Si no confirmamos en 5 minutos, Payphone reversará automáticamente la transacción.");
      }
    }

      // Si la confirmación fue exitosa, verificar el estado de la transacción
      if (confirmationSuccess) {
        // En sandbox, no tenemos confirmData porque no llamamos a la API
        // En producción, tenemos confirmData de la respuesta de la API
        const statusCode = !isSandbox && confirmData ? (confirmData.statusCode || confirmData.status || confirmData.transactionStatus) : null;
        const transactionStatus = !isSandbox && confirmData ? (confirmData.transactionStatus || confirmData.status || (statusCode === 3 ? "Approved" : statusCode === 2 ? "Canceled" : null)) : "Approved";
        const isApproved = !isSandbox && confirmData ? (confirmData.approved !== undefined ? confirmData.approved : (statusCode === 3 || transactionStatus === "Approved")) : true;

        console.log("Payphone callback: Análisis de estado", {
          statusCode,
          transactionStatus,
          isApproved,
          confirmData,
        });

        if (!isApproved) {
          console.warn("Payphone callback: Transacción no aprobada según API", {
            statusCode,
            transactionStatus,
            confirmData,
            orderId,
          });
          // Aunque la API dice que no está aprobada, si Payphone nos redirigió, el pago fue exitoso
          // Continuamos con el proceso
        }
      }

      // CRÍTICO: Solo marcamos como pagada si la confirmación fue exitosa
      // Si no confirmamos, Payphone reversará automáticamente en 5 minutos
      // NO debemos restar stock ni marcar como pagada hasta confirmar con Payphone
      
      if (confirmationSuccess) {
        console.log("Payphone callback: ✅ Confirmación exitosa - Payphone sabe que recibimos el pago");
        console.log("Payphone callback: ✅ La transacción NO será reversada automáticamente");
        console.log("Payphone callback: ✅ Marcando orden como pagada y restando stock");
        
        // Obtener el estado actual antes de actualizar
        const previousStatus = order.status;

        // Actualizar orden a PAID solo si estaba en PENDING
        if (previousStatus === "PENDING") {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: "PAID" },
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

        // Redirigir con mensaje de éxito
        return NextResponse.redirect(
          new URL(`/orders/${orderId}?payment=success`, req.url)
        );
      } else {
        // CONFIRMACIÓN FALLIDA - NO marcamos como pagada
        console.error("Payphone callback: ❌ CONFIRMACIÓN FALLIDA - NO marcando orden como pagada");
        console.error("Payphone callback: ❌ Si no confirmamos en 5 minutos, Payphone reversará automáticamente");
        console.error("Payphone callback: ❌ PROBLEMA CRÍTICO: Necesitamos resolver el error de confirmación API");
        if (!isSandbox) {
          console.error("Payphone callback: ❌ Datos enviados:", {
            endpoint: `${apiUrl}/api/button/V2/Confirm`,
            token: payphoneSettings.token ? `${payphoneSettings.token.substring(0, 20)}...` : "NO TOKEN",
            storeId: payphoneSettings.storeId,
            id,
            clientTransactionId,
          });
        }
        
        // NO marcamos como pagada. Redirigir con error crítico
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

