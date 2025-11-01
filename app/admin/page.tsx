import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminProductManager from "@/components/admin/AdminProductManager";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { adminProductInclude, toAdminProduct } from "@/lib/products/serialization";
import type { AdminProduct } from "@/lib/products/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!session || !isAdminEmail(email)) {
    redirect("/");
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: adminProductInclude,
  });

  const formatted: AdminProduct[] = products.map(toAdminProduct);

  return (
    <AdminProductManager
      initialProducts={formatted}
      adminName={session.user?.name ?? email ?? "Administrador"}
    />
  );
}
