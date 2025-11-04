import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "cart_id";
const isProd = process.env.NODE_ENV === "production";

export async function getOrCreateCart(userId?: string) {
  // Si Prisma no está disponible, retornar un carrito dummy
  if (!prisma) {
    return {
      cart: { id: "empty", userId: null },
      setCookieId: null,
    };
  }

  try {
    const store = await cookies();
    const cookieCartId = store.get(COOKIE_NAME)?.value ?? null;

    const baseSelect = { id: true, userId: true } as const;

    // Si hay usuario, priorizamos su carrito
    if (userId) {
      const userCart = await prisma.cart.findFirst({
        where: { userId },
        select: baseSelect,
      }).catch(() => null);
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
      }).catch(() => null);
      if (anon) return { cart: anon, setCookieId: null };
    }

    // Crear nuevo carrito
    const created = await prisma.cart.create({
      data: { userId: userId ?? null },
      select: baseSelect,
    }).catch(() => null);

    if (!created) {
      return {
        cart: { id: "empty", userId: null },
        setCookieId: null,
      };
    }

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
  } catch (error: any) {
    // Si hay error, retornar carrito dummy
    console.warn("Error in getOrCreateCart:", error?.message || error);
    return {
      cart: { id: "empty", userId: null },
      setCookieId: null,
    };
  }
}
