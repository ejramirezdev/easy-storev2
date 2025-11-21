import { NextResponse } from "next/server";

/**
 * Headers de seguridad HTTP para proteger la aplicación
 */
export function getSecurityHeaders(): Record<string, string> {
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    // Prevenir clickjacking
    "X-Frame-Options": "DENY",
    
    // Prevenir MIME type sniffing
    "X-Content-Type-Options": "nosniff",
    
    // XSS Protection (legacy pero útil)
    "X-XSS-Protection": "1; mode=block",
    
    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",
    
    // Permissions Policy (anteriormente Feature-Policy)
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    
    // Content Security Policy
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live", // unsafe-eval solo para Next.js en dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.amazonaws.com https://*.s3.*.amazonaws.com https://vercel.live",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
    
    // HSTS solo en producción
    ...(isProduction && {
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    }),
  };
}

/**
 * Aplica headers de seguridad a una respuesta
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

