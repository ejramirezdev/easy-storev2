import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-utils";

// Middleware de autenticación para rutas admin
// Los headers de seguridad y rate limiting se aplican en las rutas API individualmente
// 
// IMPORTANTE: El middleware solo verifica autenticación y email admin.
// La verificación 2FA se hace en cada página admin individualmente.
export default withAuth({
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const pathname = req.nextUrl.pathname;

      // Si no hay token, no está autenticado
      if (!token?.email) {
        return false;
      }

      // Permitir acceso a la página de verificación 2FA si está autenticado
      // La verificación 2FA se hará en la página misma
      if (pathname === "/admin/verify-2fa") {
        return isAdminEmail(token.email as string);
      }

      // Para otras rutas admin, verificar que es admin
      // La verificación 2FA se hará en la página individualmente
      return isAdminEmail(token.email as string);
    },
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};
