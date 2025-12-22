import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-utils";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Verificar que el usuario esté autenticado
  if (!session?.user?.id) {
    redirect("/");
  }

  // Verificar que el usuario sea admin (ADMIN o OWNER) desde la base de datos
  const isUserAdmin = await isAdmin(session.user.id);
  if (!isUserAdmin) {
    redirect("/");
  }

  // La verificación 2FA se hace en cada página individualmente
  // para evitar problemas con el layout

  return <>{children}</>;
}

