/**
 * Rate limiting simple en memoria
 * Para producción, considera usar Redis o un servicio externo
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Verifica si una IP/identificador ha excedido el límite de requests
 * @param identifier Identificador único (IP, userId, etc.)
 * @param maxRequests Número máximo de requests
 * @param windowMs Ventana de tiempo en milisegundos
 * @returns true si está dentro del límite, false si lo excedió
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minuto por defecto
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  if (!store[key] || store[key].resetTime < now) {
    // Nueva ventana de tiempo
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: store[key].resetTime,
    };
  }
  
  store[key].count += 1;
  
  if (store[key].count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: store[key].resetTime,
    };
  }
  
  return {
    allowed: true,
    remaining: maxRequests - store[key].count,
    resetTime: store[key].resetTime,
  };
}

/**
 * Obtiene la IP del cliente desde el request
 */
export function getClientIp(req: Request): string {
  // En Vercel, la IP real está en headers
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  return "unknown";
}

