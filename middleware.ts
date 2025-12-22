import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware de autenticación para rutas admin
// Los headers de seguridad y rate limiting se aplican en las rutas API individualmente
// 
// IMPORTANTE: El middleware solo verifica autenticación básica (que el usuario esté logueado).
// La verificación de roles y permisos se hace en cada página/API individualmente usando la BD.
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

        // Debug en desarrollo
        if (process.env.NODE_ENV === "development") {
          console.log("[Middleware] Checking admin access:", {
            pathname,
            hasToken: !!token,
            tokenEmail: token?.email,
            tokenId: token?.id,
          });
        }

        // Si no hay token, no está autenticado
        // La verificación de roles ADMIN/OWNER se hace en la página admin usando la BD
        // Esto permite que usuarios admin creados desde el panel puedan acceder
        const authorized = !!token;
        
        if (process.env.NODE_ENV === "development") {
          console.log("[Middleware] Authorization result:", authorized);
        }
        
        return authorized;
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
