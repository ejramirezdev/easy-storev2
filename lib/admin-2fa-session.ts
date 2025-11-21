/**
 * Gestión de sesión temporal para verificación 2FA
 * El token 2FA solo es válido para una sola solicitud inmediata después de verificación
 */

import { prisma } from "./prisma";
import { isTwoFactorEnabled } from "./admin";

// Almacenamiento temporal en memoria de tokens 2FA verificados
// En producción, podrías usar Redis o una tabla en la base de datos
const verifiedTokens = new Map<string, { userId: string; expires: number }>();

// Limpiar tokens expirados cada 5 minutos (solo en servidor)
if (typeof window === "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [token, data] of verifiedTokens.entries()) {
      if (data.expires < now) {
        verifiedTokens.delete(token);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Genera un token temporal de verificación 2FA (válido por 30 segundos)
 */
export function generate2FAToken(userId: string): string {
  const token = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  verifiedTokens.set(token, {
    userId,
    expires: Date.now() + 30 * 1000, // 30 segundos
  });
  return token;
}

/**
 * Verifica un token 2FA temporal
 */
export function verify2FAToken(token: string, userId: string): boolean {
  const tokenData = verifiedTokens.get(token);
  if (!tokenData) {
    return false;
  }

  // Verificar que el token pertenece al usuario y no ha expirado
  if (tokenData.userId !== userId || tokenData.expires < Date.now()) {
    verifiedTokens.delete(token);
    return false;
  }

  // El token solo se puede usar una vez
  verifiedTokens.delete(token);
  return true;
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
    // Si 2FA está habilitado, SIEMPRE requiere verificación
    return enabled;
  } catch (error) {
    console.error("Error verificando necesidad de 2FA:", error);
    return true; // En caso de error, requerir verificación por seguridad
  }
}

