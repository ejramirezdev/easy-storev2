import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-utils";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!session || !isAdminEmail(email)) {
    redirect("/");
  }

  // La verificación 2FA se hace en cada página individualmente
  // para evitar problemas con el layout

  return <>{children}</>;
}

