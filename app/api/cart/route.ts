import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import { calcTotals } from "@/lib/totals"; // 👈 usa tu totals actual
import { resolveProductImageUrl } from "@/lib/products/images";
import { ensureSessionUser } from "@/lib/session-user";

// Utilidad: formatea el carrito a un payload plano (Decimal -> number)
async function buildCartPayload(cartId: string) {
  // Si Prisma no está disponible, retornar carrito vacío
  if (!prisma) {
    return {
      id: cartId,
      items: [],
      count: 0,
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      coupon: null,
    };
  }

  try {
    const rawItems = await prisma.cartItem.findMany({
      where: { cartId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true, // Decimal
            imageUrl: true,
            stock: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            images: {
              orderBy: { sortOrder: "asc" },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    }).catch(() => []);

    const items = rawItems.map((it) => ({
      id: it.id,
      cartId: it.cartId,
      productId: it.productId,
      quantity: it.quantity,
      product: {
        id: it.product.id,
        name: it.product.name,
        imageUrl: resolveProductImageUrl(it.product),
        price: Number(it.product.price), // <- normalizado a number
        stock: Math.max(0, it.product.stock ?? 0),
      },
    }));

    const count = items.reduce((a, it) => a + it.quantity, 0);

    // Lines para totals (usa price como number en dólares)
    const lines = items.map((it) => ({
      price: Number(it.product.price),
      quantity: it.quantity,
    }));

    // ¿Hay cupón aplicado a este cart?
    const redemption = await prisma.couponRedemption.findFirst({
      where: { cartId },
      include: { coupon: true },
      orderBy: { createdAt: "desc" }, // por si acaso
    }).catch(() => null);
    const coupon = redemption?.coupon ?? undefined;

    // Verificar si TODOS los productos son digitales (categoría "Productos Digitales")
    // Si hay al menos un producto que NO es digital, se debe cobrar shipping
    const allProductsAreDigital = rawItems.length > 0 && rawItems.every(
      (item) => item.product?.category?.name === "Productos Digitales"
    );

    // Totales usando tu helper
    const { subtotal, discount, tax, shipping, total } = calcTotals(
      lines, 
      coupon,
      { hasOnlyDigitalProducts: allProductsAreDigital }
    );

    // Estructura final
    return {
      id: cartId,
      items,
      count,
      subtotal, // number
      discount, // number
      tax, // number - Impuesto del 15%
      shipping, // number
      total, // number
      coupon: coupon
        ? { code: coupon.code, type: coupon.type, value: Number(coupon.value) }
        : null,
    };
  } catch (error: any) {
    // Si hay error, retornar carrito vacío
    console.warn("Error in buildCartPayload:", error?.message || error);
    return {
      id: cartId,
      items: [],
      count: 0,
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      coupon: null,
    };
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = await ensureSessionUser(session);
    const userId = sessionUser?.id;
    
    // Si no hay Prisma, retornar carrito vacío
    if (!prisma) {
      return NextResponse.json({
        id: "empty",
        items: [],
        count: 0,
        subtotal: 0,
        discount: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        coupon: null,
      });
    }

    const { cart, setCookieId } = await getOrCreateCart(userId).catch(() => ({
      cart: { id: "empty" },
      setCookieId: null,
    }));

    const payload = await buildCartPayload(cart.id);

    const res = NextResponse.json(payload);
    if (setCookieId) {
      res.cookies.set(setCookieId.name, setCookieId.value, setCookieId.options);
    }
    return res;
  } catch (error: any) {
    console.warn("Error in GET /api/cart:", error?.message || error);
    return NextResponse.json({
      id: "empty",
      items: [],
      count: 0,
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      coupon: null,
    });
  }
}

// body: { productId: string, quantity?: number } -> incrementa (default 1)
export async function POST(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    const sessionUser = await ensureSessionUser(session);
    const userId = sessionUser?.id;
    const { productId, quantity = 1 } = (await req.json()) as {
      productId: string;
      quantity?: number;
    };

    if (!productId || quantity <= 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Validar producto
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true },
    }).catch(() => null);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { cart, setCookieId } = await getOrCreateCart(userId);
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
      select: { quantity: true },
    }).catch(() => null);

    const availableStock = Math.max(0, product.stock ?? 0);
    const desiredQuantity = Math.min(
      availableStock,
      (existingItem?.quantity ?? 0) + quantity
    );

    if (desiredQuantity <= 0) {
      if (existingItem) {
        await prisma.cartItem.delete({
          where: { cartId_productId: { cartId: cart.id, productId } },
        }).catch(() => {});
      }
    } else if (!existingItem) {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity: desiredQuantity },
      }).catch(() => {});
    } else if (existingItem.quantity !== desiredQuantity) {
      await prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity: desiredQuantity },
      }).catch(() => {});
    }

    const payload = await buildCartPayload(cart.id);

    const res = NextResponse.json(payload);
    if (setCookieId) {
      res.cookies.set(setCookieId.name, setCookieId.value, setCookieId.options);
    }
    return res;
  } catch (error: any) {
    console.warn("Error in POST /api/cart:", error?.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// body: { productId: string, quantity: number } -> setea cantidad exacta (0 elimina)
export async function PATCH(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    const sessionUser = await ensureSessionUser(session);
    const userId = sessionUser?.id;
    const { productId, quantity } = (await req.json()) as {
      productId: string;
      quantity: number;
    };

    if (!productId || typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true },
    }).catch(() => null);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { cart, setCookieId } = await getOrCreateCart(userId);

    const availableStock = Math.max(0, product.stock ?? 0);
    const safeQuantity = Math.min(availableStock, quantity);

    if (safeQuantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      }).catch(() => {});
    } else {
      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        create: { cartId: cart.id, productId, quantity: safeQuantity },
        update: { quantity: safeQuantity },
      }).catch(() => {});
    }

    const payload = await buildCartPayload(cart.id);

    const res = NextResponse.json(payload);
    if (setCookieId) {
      res.cookies.set(setCookieId.name, setCookieId.value, setCookieId.options);
    }
    return res;
  } catch (error: any) {
    console.warn("Error in PATCH /api/cart:", error?.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// body: { productId: string } -> elimina ítem
export async function DELETE(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    const sessionUser = await ensureSessionUser(session);
    const userId = sessionUser?.id;
    const { productId } = (await req.json()) as { productId: string };

    if (!productId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { cart, setCookieId } = await getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    }).catch(() => {});

    const payload = await buildCartPayload(cart.id);

    const res = NextResponse.json(payload);
    if (setCookieId) {
      res.cookies.set(setCookieId.name, setCookieId.value, setCookieId.options);
    }
    return res;
  } catch (error: any) {
    console.warn("Error in DELETE /api/cart:", error?.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
