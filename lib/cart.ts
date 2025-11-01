import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "cart_id";
const isProd = process.env.NODE_ENV === "production";

export async function getOrCreateCart(userId?: string) {
  const store = cookies();
  const cookieCartId = store.get(COOKIE_NAME)?.value ?? null;

  const baseSelect = { id: true, userId: true } as const;

  // Si hay usuario, priorizamos su carrito
  if (userId) {
    const userCart = await prisma.cart.findFirst({
      where: { userId },
      select: baseSelect,
    });
    if (userCart) {
      // si existía carrito anónimo, opcionalmente podrías fusionarlo aquí
      return { cart: userCart, setCookieId: null };
    }
  }

  // Usar carrito anónimo por cookie si existe
  if (cookieCartId) {
    const anon = await prisma.cart.findUnique({
      where: { id: cookieCartId },
      select: baseSelect,
    });
    if (anon) return { cart: anon, setCookieId: null };
  }

  // Crear nuevo carrito
  const created = await prisma.cart.create({
    data: { userId: userId ?? null },
    select: baseSelect,
  });

  return {
    cart: created,
    setCookieId: {
      name: COOKIE_NAME,
      value: created.id,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: isProd,
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: "/",
      },
    },
  };
}
