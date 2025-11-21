import { prisma } from "./prisma";

type AdminAction = 
  | "LOGIN"
  | "LOGIN_2FA"
  | "LOGOUT"
  | "PRODUCT_CREATE"
  | "PRODUCT_UPDATE"
  | "PRODUCT_DELETE"
  | "ORDER_UPDATE"
  | "ORDER_DELETE"
  | "CATEGORY_CREATE"
  | "CATEGORY_UPDATE"
  | "CATEGORY_DELETE"
  | "PAYPHONE_SETTINGS_UPDATE"
  | "2FA_ENABLE"
  | "2FA_DISABLE"
  | "ACCESS_DENIED";

type AdminLogData = {
  userId: string;
  email: string;
  action: AdminAction;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Registra una acción administrativa en los logs
 */
export async function logAdminAction(data: AdminLogData): Promise<void> {
  try {
    // En producción, podrías guardar esto en una tabla de logs
    // Por ahora, solo lo registramos en la consola
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: data.userId,
      email: data.email,
      action: data.action,
      details: data.details || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    };

    console.log("[ADMIN LOG]", JSON.stringify(logEntry, null, 2));

    // TODO: En el futuro, guardar en una tabla AdminLog en la base de datos
    // await prisma.adminLog.create({
    //   data: {
    //     userId: data.userId,
    //     action: data.action,
    //     details: data.details,
    //     ipAddress: data.ipAddress,
    //     userAgent: data.userAgent,
    //   },
    // });
  } catch (error) {
    // No fallar si el logging falla
    console.error("Error logging admin action:", error);
  }
}

/**
 * Obtiene la IP del cliente desde el request
 */
export function getClientIP(req: Request): string | undefined {
  try {
    // Intentar obtener de headers comunes
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    const realIP = req.headers.get("x-real-ip");
    if (realIP) {
      return realIP;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Obtiene el User-Agent del cliente desde el request
 */
export function getClientUserAgent(req: Request): string | undefined {
  try {
    return req.headers.get("user-agent") || undefined;
  } catch {
    return undefined;
  }
}

