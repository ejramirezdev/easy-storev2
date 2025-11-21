import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { isTwoFactorEnabled } from "./admin";

/**
 * Verifica si el usuario tiene 2FA verificado en esta sesión
 */
export async function isTwoFactorVerified(userId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const verified = cookieStore.get("twoFactorVerified");
    
    if (!verified || verified.value !== "true") {
      return false;
    }

    // Verificar que el usuario tenga 2FA habilitado
    const enabled = await isTwoFactorEnabled(userId);
    if (!enabled) {
      return true; // Si no tiene 2FA habilitado, no necesita verificación
    }

    return true;
  } catch (error) {
    console.error("Error verificando sesión 2FA:", error);
    return false;
  }
}

/**
 * Verifica si el usuario necesita verificar 2FA
 */
export async function requiresTwoFactorVerification(userId: string): Promise<boolean> {
  try {
    const enabled = await isTwoFactorEnabled(userId);
    if (!enabled) {
      return false; // No necesita verificación si 2FA no está habilitado
    }

    const verified = await isTwoFactorVerified(userId);
    return !verified; // Necesita verificación si está habilitado pero no verificado
  } catch (error) {
    console.error("Error verificando necesidad de 2FA:", error);
    return true; // En caso de error, requerir verificación por seguridad
  }
}

