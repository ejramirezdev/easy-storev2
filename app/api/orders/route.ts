// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import { calcTotals } from "@/lib/totals";
import { resolveProductImageUrl } from "@/lib/products/images";

type AddressInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  documentType?: string;
  documentId?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { shipping, billing, notes } = body as {
      shipping: AddressInput;
      billing?: AddressInput | { useShipping: true };
      notes?: string;
    };

    const { cart } = await getOrCreateCart(session.user.id);
    if (!cart)
      return NextResponse.json(
        { ok: false, error: "Carrito no encontrado" },
        { status: 404 }
      );

    // items del carrito (con precios actuales y categorías)
    const rawItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            price: true,
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
    });
    if (rawItems.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Carrito vacío" },
        { status: 400 }
      );
    }

    const items = rawItems.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      unitPrice: String(it.product!.price), // Decimal como string
      snapshot: {
        name: it.product!.name,
        slug: it.product!.slug,
        imageUrl: resolveProductImageUrl(it.product!),
      },
    }));

    // cupón aplicado
    const redemption = await prisma.couponRedemption.findFirst({
      where: { cartId: cart.id },
      orderBy: { createdAt: "desc" },
      include: { coupon: true },
    });

    // Verificar si TODOS los productos son digitales (categoría "Productos Digitales")
    // Si hay al menos un producto que NO es digital, se debe cobrar shipping
    const allProductsAreDigital = rawItems.length > 0 && rawItems.every(
      (item) => item.product?.category?.name === "Productos Digitales"
    );

    // totales (números en USD)
    const totals = calcTotals(
      items.map((x) => ({ price: Number(x.unitPrice), quantity: x.quantity })),
      redemption?.coupon ?? undefined,
      { hasOnlyDigitalProducts: allProductsAreDigital }
    );

    // direcciones
    // crear orden + items
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        total: String(totals.total), // Decimal(10,2)
        // Guardar información del cupón y totales para mostrar correctamente en detalles
        subtotal: String(totals.subtotal),
        shipping: String(totals.shipping),
        couponCode: redemption?.coupon?.code ?? null,
        couponType: redemption?.coupon?.type ?? null,
        couponValue: redemption?.coupon?.value ? String(redemption.coupon.value) : null,
        couponDiscount: totals.discount > 0 ? String(totals.discount) : null,
        items: {
          create: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice, // Decimal as string
            // si luego agregas campos snapshot en OrderItem, puedes guardarlos aquí
          })),
        },
        addresses: {
          create: [
            normalizeAddress(shipping, "SHIPPING"),
            normalizeAddress(
              billing && "useShipping" in billing
                ? shipping
                : ((billing as AddressInput) ?? shipping),
              "BILLING"
            ),
          ],
        },
      },
    });

    // NO guardar automáticamente los datos en el perfil
    // Solo se guardarán cuando el usuario los actualice manualmente desde /account/profile

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error creando orden" },
      { status: 400 }
    );
  }
}

function normalizeAddress(address: AddressInput, type: "SHIPPING" | "BILLING") {
  return {
    type,
    firstName: address.firstName,
    lastName: address.lastName,
    email: address.email,
    phone: address.phone ?? "",
    documentType: address.documentType ?? null,
    document: address.documentId ?? null,
    street: address.line2
      ? `${address.line1}\n${address.line2}`
      : address.line1,
    city: address.city,
    state: address.state ?? "",
    postalCode: address.postalCode ?? null,
    country: address.country,
  };
}
