/**
 * Utilidades de admin
 * Mantiene compatibilidad con funciones basadas en email para migración gradual
 */

// Mantener para compatibilidad temporal durante migración
export const ADMIN_EMAILS = ["ejramirezdev@gmail.com"] as const;

/**
 * @deprecated Usar isAdmin(userId) en su lugar
 * Verifica si un email está en la lista de admins (solo para compatibilidad)
 * Esta función es segura para usar en el cliente (no usa Prisma)
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === email.toLowerCase());
}

/**
 * Verifica si un usuario es admin (ADMIN o OWNER) basado en su ID
 * Esta es la función principal que debe usarse
 * SOLO PARA USO EN SERVIDOR (usa Prisma)
 */
export async function isAdmin(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  // Lazy import para evitar cargar Prisma en el cliente
  const { isAdmin: checkIsAdmin } = await import("./admin-permissions");
  return checkIsAdmin(userId);
}

/**
 * Verifica si un usuario es OWNER
 * SOLO PARA USO EN SERVIDOR (usa Prisma)
 */
export async function isOwner(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  // Lazy import para evitar cargar Prisma en el cliente
  const { isOwner: checkIsOwner } = await import("./admin-permissions");
  return checkIsOwner(userId);
}

/**
 * Verifica si un usuario es ADMIN (no OWNER)
 * SOLO PARA USO EN SERVIDOR (usa Prisma)
 */
export async function isAdminRole(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  // Lazy import para evitar cargar Prisma en el cliente
  const { isAdminRole: checkIsAdminRole } = await import("./admin-permissions");
  return checkIsAdminRole(userId);
}

/**
 * Obtiene el userId desde un email (para migración gradual)
 * SOLO PARA USO EN SERVIDOR (usa Prisma)
 */
export async function getUserIdFromEmail(email?: string | null): Promise<string | null> {
  if (!email) return null;
  
  // Lazy import para evitar cargar Prisma en el cliente
  const { prisma } = await import("./prisma");
  if (!prisma) return null;
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    
    return user?.id ?? null;
  } catch (error) {
    console.error("Error obteniendo userId desde email:", error);
    return null;
  }
}

/**
 * Verifica si un email corresponde a un admin (compatibilidad + nueva lógica)
 * Combina verificación antigua (lista) con nueva (BD)
 * SOLO PARA USO EN SERVIDOR (usa Prisma)
 */
export async function isAdminEmailAsync(email?: string | null): Promise<boolean> {
  if (!email) return false;
  
  // Primero verificar en BD (nuevo sistema)
  const userId = await getUserIdFromEmail(email);
  if (userId) {
    return isAdmin(userId);
  }
  
  // Fallback a lista hardcodeada (compatibilidad)
  return isAdminEmail(email);
}

