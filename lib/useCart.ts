"use client";
import useSWR, { MutatorCallback, MutatorOptions, useSWRConfig, mutate as swrMutate } from "swr";
import { useCallback, useState } from "react";

type CartProduct = {
  id: string;
  name: string;
  price: number; // ya numérico desde la API
  imageUrl?: string | null; // clave correcta
  stock: number;
};

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
};

type CartResponse = {
  id: string;
  items: CartItem[];
  count: number;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  coupon: { code: string; type: string; value: number } | null;
};

const CART_KEY = "/api/cart";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Refresca el carrito globalmente desde cualquier componente.
 * Útil para invalidar el cache después de operaciones como pagos.
 */
export async function refreshCartGlobally() {
  await swrMutate(CART_KEY);
}

type Action = "inc" | "dec" | "remove" | "add";

type UseCartOptions = {
  /**
   * Permite omitir la carga inicial del carrito.
   * Útil en botones como "Agregar al carrito" donde solo necesitamos las acciones.
   */
  fetchOnMount?: boolean;
};

export function useCart(options?: UseCartOptions) {
  const fetchOnMount = options?.fetchOnMount ?? true;
  const swr = useSWR<CartResponse>(fetchOnMount ? CART_KEY : null, fetcher, {
    revalidateOnFocus: false,
  });
  const { mutate: swrMutate, data, error, isLoading } = swr;
  const { mutate: globalMutate } = useSWRConfig();

  const mutateCart = useCallback(
    async (
      data?: CartResponse | Promise<CartResponse> | MutatorCallback<CartResponse>,
      opts?: MutatorOptions<CartResponse>
    ) => {
      if (fetchOnMount) {
        return swrMutate(data, opts);
      }
      return globalMutate(CART_KEY, data, opts);
    },
    [fetchOnMount, swrMutate, globalMutate]
  );

  // ---- loaders por botón ----
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const key = (productId: string, action: Action) => `${productId}:${action}`;
  const setP = (productId: string, action: Action, v: boolean) =>
    setPending((p) => ({ ...p, [key(productId, action)]: v }));

  function isPending(productId: string, action?: Action) {
    if (action) return !!pending[key(productId, action)];
    return (["inc", "dec", "remove", "add"] as Action[]).some(
      (a) => pending[key(productId, a)]
    );
  }

  // ---- acciones ----
  async function add(productId: string, quantity = 1) {
    setP(productId, "add", true);
    await mutateCart(
      async () => {
        await fetch(CART_KEY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        return await fetcher(CART_KEY);
      },
      { revalidate: false }
    );
    setP(productId, "add", false);
  }

  async function setQty(productId: string, quantity: number) {
    await mutateCart(
      async () => {
        await fetch(CART_KEY, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        return await fetcher(CART_KEY);
      },
      { revalidate: false }
    );
  }

  async function remove(productId: string) {
    setP(productId, "remove", true);
    await mutateCart(
      async () => {
        await fetch(CART_KEY, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        return await fetcher(CART_KEY);
      },
      { revalidate: false }
    );
    setP(productId, "remove", false);
  }

  // eliminar sin activar el loader de "Quitar"
  async function removeSilently(productId: string) {
    await mutateCart(
      async () => {
        await fetch(CART_KEY, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        return await fetcher(CART_KEY);
      },
      { revalidate: false }
    );
  }

  async function inc(productId: string, currentQty: number) {
    setP(productId, "inc", true);
    await setQty(productId, currentQty + 1);
    setP(productId, "inc", false);
  }

  async function dec(productId: string, currentQty: number) {
    setP(productId, "dec", true);
    if (currentQty <= 1) {
      await removeSilently(productId);
    } else {
      await setQty(productId, currentQty - 1);
    }
    setP(productId, "dec", false);
  }

  // ---- NUEVO: refrescar desde fuera (p. ej., al aplicar/quitar cupón) ----
  async function refresh() {
    // sin argumentos => SWR revalida contra el fetcher
    if (fetchOnMount) {
      await swr.mutate();
      return;
    }
    await globalMutate(CART_KEY);
  }

  return {
    cart: data,
    items: data?.items ?? [],
    count: data?.count ?? 0,
    subtotal: data?.subtotal ?? 0,
    isLoading,
    error,
    add,
    setQty,
    remove,
    inc,
    dec,
    isPending,
    refresh, // 👈 úsalo en /app/cart/page.tsx
  };
}
