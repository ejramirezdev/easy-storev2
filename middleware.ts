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

      // Verificar que es admin
      if (!isAdminEmail(token.email as string)) {
        return false;
      }

      // Permitir acceso a la página de configuración 2FA y verificación 2FA
      // Estas páginas permiten configurar 2FA incluso si no está habilitado
      if (pathname === "/admin/2fa" || pathname === "/admin/verify-2fa") {
        return true;
      }

      // Para otras rutas admin, la verificación 2FA se hará en la página individualmente
      return true;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};
