import { NextRequest, NextResponse } from "next/server";
import { getSecurityHeaders } from "@/lib/security/headers";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

/**
 * Middleware de seguridad que aplica headers y rate limiting
 */
export function securityMiddleware(req: NextRequest) {
  const response = NextResponse.next();
  
  // Aplicar headers de seguridad
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Rate limiting para rutas API
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(
      `${ip}:${req.nextUrl.pathname}`,
      100, // 100 requests por minuto para APIs
      60000
    );
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Por favor intenta más tarde." },
        { 
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
            ...securityHeaders,
          },
        }
      );
    }
    
    // Agregar headers de rate limit
    response.headers.set("X-RateLimit-Limit", "100");
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetTime / 1000)));
  }
  
  return response;
}




