import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import FavoritesContent from "@/components/account/FavoritesContent";
import { resolveProductImageUrl } from "@/lib/products/images";
import { Paper, Stack, Typography } from "@mui/material";

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

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "rgba(255,255,255,0.02)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={700}>
            Favoritos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aquí verás los productos que guardaste para revisar más tarde.
          </Typography>
        </Stack>
        <FavoritesContent initialItems={items} />
      </Stack>
    </Paper>
  );
}
