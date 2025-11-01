"use client";

import useSWR from "swr";

const FAVORITES_KEY = "/api/favorites";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (res.status === 401) {
    return { ok: false, items: [] } as FavoritesResponse;
  }
  return (await res.json()) as FavoritesResponse;
};

type FavoritesResponse = {
  ok: boolean;
  items: {
    id: string;
    createdAt: string;
    product: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      price: number;
      stock: number;
      imageUrl: string | null;
    };
  }[];
};

type UseFavoritesOptions = {
  fallbackData?: FavoritesResponse;
};

export function useFavorites(options?: UseFavoritesOptions) {
  const { data, mutate, isLoading } = useSWR<FavoritesResponse>(FAVORITES_KEY, fetcher, {
    revalidateOnFocus: false,
    fallbackData: options?.fallbackData,
  });

  const items = data?.items ?? [];

  async function add(productId: string) {
    await fetch(FAVORITES_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    await mutate();
  }

  async function remove(productId: string) {
    const url = `${FAVORITES_KEY}?productId=${encodeURIComponent(productId)}`;
    await fetch(url, { method: "DELETE" });
    await mutate();
  }

  function isFavorite(productId: string) {
    return items.some((item) => item.product.id === productId);
  }

  return {
    favorites: items,
    isLoading,
    add,
    remove,
    isFavorite,
    mutate,
  };
}
