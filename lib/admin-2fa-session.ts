/**
 * Gestión de sesión temporal para verificación 2FA
 * El token 2FA solo es válido para una sola solicitud inmediata después de verificación
 * 
 * IMPORTANTE: Usa base de datos en lugar de memoria para funcionar en producción serverless
 */

import { prisma } from "./prisma";
import { isTwoFactorEnabled } from "./admin";

/**
 * Genera un token temporal de verificación 2FA (válido por 30 segundos)
 * Almacena el token en la base de datos para que funcione en producción serverless
 */
export async function generate2FAToken(userId: string): Promise<string> {
  const token = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const expires = new Date(Date.now() + 30 * 1000); // 30 segundos

  try {
    // Verificar que Prisma Client esté inicializado
    if (!prisma) {
      throw new Error("Prisma Client no está inicializado");
    }

    // Guardar token en base de datos
    await prisma.twoFactorToken.create({
      data: {
        userId,
        token,
        expires,
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[2FA Debug] Token generado y guardado en BD:", token.substring(0, 20) + "...");
    }

    // Limpiar tokens expirados de este usuario (en background, no bloquea)
    prisma.twoFactorToken
      .deleteMany({
        where: {
          userId,
          expires: {
            lt: new Date(),
          },
        },
      })
      .catch((err) => {
        console.error("Error limpiando tokens expirados:", err);
      });

    return token;
  } catch (error: any) {
    console.error("Error generando token 2FA:", error);
    
    // Si el error es que la tabla no existe, dar un mensaje más útil
    if (error?.code === "P2001" || error?.message?.includes("does not exist")) {
      throw new Error(
        "La tabla TwoFactorToken no existe en la base de datos. Ejecuta 'npx prisma migrate dev' para crear la tabla."
      );
    }
    
    // Si el error es que Prisma Client no tiene el modelo, dar instrucciones
    if (error?.message?.includes("twoFactorToken") || error?.message?.includes("Cannot read properties")) {
      throw new Error(
        "Prisma Client no tiene el modelo TwoFactorToken. Detén el servidor, ejecuta 'npx prisma generate' y reinicia."
      );
    }
    
    throw new Error("Error al generar token de verificación");
  }
}

/**
 * Verifica un token 2FA temporal
 * Elimina el token después de verificar (un solo uso)
 */
export async function verify2FAToken(token: string, userId: string): Promise<boolean> {
  try {
    if (!prisma) {
      console.error("[2FA Error] Prisma Client no está inicializado");
      return false;
    }

    // Buscar el token en la base de datos
    const tokenRecord = await prisma.twoFactorToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      if (process.env.NODE_ENV === "development") {
        console.log("[2FA Debug] Token no encontrado en BD:", token);
      }
      return false;
    }

    // Verificar que el token pertenece al usuario
    if (tokenRecord.userId !== userId) {
      if (process.env.NODE_ENV === "development") {
        console.log("[2FA Debug] Token pertenece a otro usuario");
      }
      // Eliminar token inválido
      await prisma.twoFactorToken.delete({
        where: { token },
      }).catch(() => {
        // Ignorar errores de eliminación
      });
      return false;
    }

    // Verificar que no ha expirado
    if (tokenRecord.expires < new Date()) {
      if (process.env.NODE_ENV === "development") {
        console.log("[2FA Debug] Token expirado");
      }
      // Eliminar token expirado
      await prisma.twoFactorToken.delete({
        where: { token },
      }).catch(() => {
        // Ignorar errores de eliminación
      });
      return false;
    }

    // El token solo se puede usar una vez - eliminarlo después de verificar
    await prisma.twoFactorToken.delete({
      where: { token },
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[2FA Debug] Token verificado correctamente");
    }

    return true;
  } catch (error) {
    console.error("Error verificando token 2FA:", error);
    return false;
  }
}

/**
 * Verifica si el usuario necesita verificar 2FA en cada acceso
 * 
 * IMPORTANTE: Siempre requiere verificación si 2FA está habilitado.
 * El código 2FA se debe ingresar en cada acceso al panel admin.
 */
export async function requiresTwoFactorVerification(userId: string): Promise<boolean> {
  try {
    const enabled = await isTwoFactorEnabled(userId);
    
    // Log para debug
    if (process.env.NODE_ENV === "development") {
      console.log("[2FA Debug] Checking 2FA for user:", userId);
      console.log("[2FA Debug] 2FA enabled:", enabled);
    }
    
    // Si 2FA está habilitado, SIEMPRE requiere verificación
    return enabled;
  } catch (error) {
    console.error("Error verificando necesidad de 2FA:", error);
    // En caso de error, requerir verificación por seguridad
    return true;
  }
}

