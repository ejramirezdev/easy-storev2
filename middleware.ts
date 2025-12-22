import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-utils";
import type { NextRequest } from "next/server";

// Middleware de autenticación para rutas admin
// Los headers de seguridad y rate limiting se aplican en las rutas API individualmente
// 
// IMPORTANTE: El middleware solo verifica autenticación básica.
// La verificación de roles y permisos se hace en cada página/API individualmente.
// La verificación 2FA también se hace en cada página admin individualmente.
export default withAuth(
  function middleware(req: NextRequest) {
    // Eliminar X-Powered-By para todas las rutas
    const response = NextResponse.next();
    response.headers.delete("X-Powered-By");
    return response;
  },
  {
    pages: {
      signIn: "/",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Si no es ruta admin, permitir acceso (solo eliminamos X-Powered-By)
        if (!pathname.startsWith("/admin")) {
          return true;
        }

        // Si no hay token, no está autenticado
        if (!token?.email) {
          return false;
        }

        // Verificación básica de email admin (compatibilidad)
        // La verificación completa de roles se hace en las páginas/APIs
        if (!isAdminEmail(token.email as string)) {
          return false;
        }

        // Permitir acceso a la página de configuración 2FA y verificación 2FA
        // Estas páginas permiten configurar 2FA incluso si no está habilitado
        if (pathname === "/admin/2fa" || pathname === "/admin/verify-2fa") {
          return true;
        }

        // Para otras rutas admin, la verificación de roles y 2FA se hará en la página individualmente
        return true;
      },
    },
  }
);

export const config = {
  // Aplicar a todas las rutas para eliminar X-Powered-By
  // La autenticación solo se aplica a rutas /admin
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/admin/:path*",
  ],
};
