import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminProductManager from "@/components/admin/AdminProductManager";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { adminProductInclude, toAdminProduct } from "@/lib/products/serialization";
import type { AdminCategory, AdminProduct } from "@/lib/products/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminPayboxSettings from "@/components/admin/AdminPayboxSettings";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!session || !isAdminEmail(email)) {
    redirect("/");
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: adminProductInclude,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const formatted: AdminProduct[] = products.map(toAdminProduct);
  const formattedCategories: AdminCategory[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));

  return (
    <>
      <AdminPayboxSettings />
      <AdminProductManager
        initialProducts={formatted}
        categories={formattedCategories}
        adminName={session.user?.name ?? email ?? "Administrador"}
      />
    </>
  );
}
