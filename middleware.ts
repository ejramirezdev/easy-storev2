import { withAuth } from "next-auth/middleware";
import { isAdminEmail } from "@/lib/admin-utils";

// Middleware de autenticación para rutas admin
// Los headers de seguridad y rate limiting se aplican en las rutas API individualmente
export default withAuth({
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized: ({ token }) => {
      if (!token?.email) return false;
      return isAdminEmail(token.email as string);
    },
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};
