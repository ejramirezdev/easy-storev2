/**
 * Helper para aplicar headers de seguridad y rate limiting en rutas API
 * Usar este helper en las rutas API individuales
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSecurityHeaders } from "@/lib/security/headers";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

/**
 * Aplica headers de seguridad a una respuesta
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Verifica rate limiting y retorna respuesta si se excede el límite
 */
export function checkRateLimitForPath(
  req: NextRequest,
  pathname: string
): { allowed: boolean; response?: NextResponse } {
  const ip = getClientIp(req);
  
  // Límites más estrictos para rutas sensibles
  let maxRequests = 100;
  let windowMs = 60000; // 1 minuto
  
  if (pathname.includes("/contact") || pathname.includes("/services/")) {
    maxRequests = 5; // 5 requests por minuto para formularios
  } else if (pathname.includes("/auth")) {
    maxRequests = 10; // 10 requests por minuto para autenticación
  }
  
  const rateLimit = checkRateLimit(`${ip}:${pathname}`, maxRequests, windowMs);
  
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: "Demasiadas solicitudes. Por favor intenta más tarde." },
      { status: 429 }
    );
    response.headers.set("Retry-After", String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)));
    applySecurityHeaders(response);
    return { allowed: false, response };
  }
  
  return { allowed: true };
}

/**
 * Aplica headers de rate limit a una respuesta
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  maxRequests: number,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(maxRequests));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)));
  return response;
}

