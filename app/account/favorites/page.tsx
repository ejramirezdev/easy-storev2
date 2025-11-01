import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import FavoritesContent from "@/components/account/FavoritesContent";
import { resolveProductImageUrl } from "@/lib/products/images";

export default async function AccountFavoritesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/account/favorites");
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          stock: true,
          imageUrl: true,
          images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
    },
  });

  const items = favorites
    .filter((fav) => fav.product)
    .map((fav) => ({
      id: fav.id,
      createdAt: fav.createdAt.toISOString(),
      product: {
        id: fav.product!.id,
        name: fav.product!.name,
        slug: fav.product!.slug,
        description: fav.product!.description,
        price: Number(fav.product!.price),
        stock: fav.product!.stock ?? 0,
        imageUrl: resolveProductImageUrl({
          imageUrl: fav.product!.imageUrl,
          images: fav.product!.images,
        }),
      },
    }));

  return <FavoritesContent initialItems={items} />;
}
