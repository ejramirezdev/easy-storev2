// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

    // items del carrito (con precios actuales)
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

    // totales (números en USD)
    const totals = calcTotals(
      items.map((x) => ({ price: Number(x.unitPrice), quantity: x.quantity })),
      redemption?.coupon ?? undefined
    );

    // direcciones
    // crear orden + items
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        total: String(totals.total), // Decimal(10,2)
        subtotal: String(totals.subtotal),
        discountTotal: String(totals.discount),
        shippingTotal: String(totals.shipping),
        paymentStatus: "PENDING",
        paymentProvider: "PAYBOX",
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

    const billingAddressInput =
      billing && "useShipping" in billing
        ? shipping
        : ((billing as AddressInput | undefined) ?? shipping);

    const payboxSnapshot = buildPayboxSnapshot({
      orderId: order.id,
      totals,
      shipping,
      billing: billingAddressInput,
      items,
      couponCode: redemption?.coupon?.code,
    });

    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        email: shipping.email,
        phone: shipping.phone ?? null,
        documentType: shipping.documentType ?? null,
        documentId: shipping.documentId ?? null,
        shippingLine1: shipping.line1,
        shippingLine2: shipping.line2 ?? null,
        shippingCity: shipping.city,
        shippingState: shipping.state ?? null,
        shippingPostalCode: shipping.postalCode ?? null,
        shippingCountry: shipping.country,
        billingFirstName: billingAddressInput.firstName ?? shipping.firstName,
        billingLastName: billingAddressInput.lastName ?? shipping.lastName,
        billingEmail: billingAddressInput.email ?? shipping.email,
        billingPhone: billingAddressInput.phone ?? null,
        billingDocumentType: billingAddressInput.documentType ?? null,
        billingDocumentId: billingAddressInput.documentId ?? null,
        billingLine1: billingAddressInput.line1 ?? shipping.line1,
        billingLine2: billingAddressInput.line2 ?? null,
        billingCity: billingAddressInput.city ?? shipping.city,
        billingState: billingAddressInput.state ?? null,
        billingPostalCode: billingAddressInput.postalCode ?? null,
        billingCountry: billingAddressInput.country ?? shipping.country,
      },
      update: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        email: shipping.email,
        phone: shipping.phone ?? null,
        documentType: shipping.documentType ?? null,
        documentId: shipping.documentId ?? null,
        shippingLine1: shipping.line1,
        shippingLine2: shipping.line2 ?? null,
        shippingCity: shipping.city,
        shippingState: shipping.state ?? null,
        shippingPostalCode: shipping.postalCode ?? null,
        shippingCountry: shipping.country,
        billingFirstName: billingAddressInput.firstName ?? shipping.firstName,
        billingLastName: billingAddressInput.lastName ?? shipping.lastName,
        billingEmail: billingAddressInput.email ?? shipping.email,
        billingPhone: billingAddressInput.phone ?? null,
        billingDocumentType: billingAddressInput.documentType ?? null,
        billingDocumentId: billingAddressInput.documentId ?? null,
        billingLine1: billingAddressInput.line1 ?? shipping.line1,
        billingLine2: billingAddressInput.line2 ?? null,
        billingCity: billingAddressInput.city ?? shipping.city,
        billingState: billingAddressInput.state ?? null,
        billingPostalCode: billingAddressInput.postalCode ?? null,
        billingCountry: billingAddressInput.country ?? shipping.country,
      },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      totals,
      paybox: payboxSnapshot,
    });
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

function buildPayboxSnapshot({
  orderId,
  totals,
  shipping,
  billing,
  items,
  couponCode,
}: {
  orderId: string;
  totals: ReturnType<typeof calcTotals>;
  shipping: AddressInput;
  billing: AddressInput;
  items: {
    productId: string;
    quantity: number;
    unitPrice: string;
    snapshot: {
      name: string;
      slug: string;
      imageUrl: string | null;
    };
  }[];
  couponCode?: string;
}) {
  return {
    reference: orderId,
    amount: Number(totals.total.toFixed(2)),
    currency: "USD",
    description: `Orden ${orderId.slice(0, 8).toUpperCase()}`,
    customer: {
      name: `${shipping.firstName} ${shipping.lastName}`.trim(),
      email: shipping.email,
      phone: shipping.phone ?? "",
      documentType: shipping.documentType ?? "",
      documentId: shipping.documentId ?? "",
    },
    billing: {
      name: `${billing.firstName ?? shipping.firstName} ${
        billing.lastName ?? shipping.lastName
      }`.trim(),
      email: billing.email ?? shipping.email,
      phone: billing.phone ?? shipping.phone ?? "",
      documentType: billing.documentType ?? shipping.documentType ?? "",
      documentId: billing.documentId ?? shipping.documentId ?? "",
    },
    items: items.map((item) => ({
      id: item.productId,
      name: item.snapshot.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
    breakdown: {
      subtotal: Number(totals.subtotal.toFixed(2)),
      discount: Number(totals.discount.toFixed(2)),
      shipping: Number(totals.shipping.toFixed(2)),
      total: Number(totals.total.toFixed(2)),
      coupon: couponCode ?? null,
    },
  };
}
