import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const SUCCESS_STATUSES = new Set([
  "APPROVED",
  "PAID",
  "SUCCESS",
  "COMPLETED",
  "CAPTURED",
  "AUTHORIZED",
  "AUTHORISED",
]);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Debes iniciar sesión" },
        { status: 401 }
      );
    }

    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const isOwner = order.userId === session.user.id;
    const isAdmin = (session.user as any)?.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { ok: false, error: "No tienes acceso a esta orden" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as any;
    const token = typeof body?.token === "string" ? body.token : undefined;
    const provider =
      typeof body?.provider === "string"
        ? body.provider
        : order.paymentProvider ?? "PAYBOX";
    const payload = sanitizeJson(body?.payload ?? {});

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Token de pago inválido" },
        { status: 400 }
      );
    }

    const storedTotals = resolveStoredTotals(order);
    const reportedTotals = body?.totals ?? {};
    const reportedTotal = parseAmount(
      reportedTotals?.total ?? body?.amount ?? body?.total
    );
    const reportedSubtotal = parseAmount(
      reportedTotals?.subtotal ?? body?.subtotal
    );
    const reportedDiscount = parseAmount(
      reportedTotals?.discount ?? body?.discount
    );
    const reportedShipping = parseAmount(
      reportedTotals?.shipping ?? body?.shipping
    );

    if (reportedTotal == null) {
      return NextResponse.json(
        { ok: false, error: "Monto total inválido" },
        { status: 400 }
      );
    }

    const mismatch =
      !nearlyEqual(reportedTotal, storedTotals.total) ||
      (reportedSubtotal != null && !nearlyEqual(reportedSubtotal, storedTotals.subtotal)) ||
      (reportedDiscount != null && !nearlyEqual(reportedDiscount, storedTotals.discount)) ||
      (reportedShipping != null && !nearlyEqual(reportedShipping, storedTotals.shipping));

    if (mismatch) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
          paymentProvider: provider,
          paymentToken: token,
          paymentPayload: {
            ...payload,
            errorMessage: body?.error ?? "Los montos no coinciden",
            reportedTotals: {
              subtotal: reportedSubtotal,
              discount: reportedDiscount,
              shipping: reportedShipping,
              total: reportedTotal,
            },
            storedTotals,
          },
          paidAt: null,
        },
      });

      return NextResponse.json(
        { ok: false, error: "Los montos reportados no coinciden con la orden" },
        { status: 422 }
      );
    }

    const normalizedStatus = String(body?.status ?? payload?.status ?? "").toUpperCase();
    const explicitApproval =
      body?.approved === true ||
      (typeof body?.approved === "string" &&
        body.approved.toLowerCase() === "true");
    const isApproved =
      explicitApproval || (normalizedStatus && SUCCESS_STATUSES.has(normalizedStatus));

    if (isApproved) {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          paymentProvider: provider,
          paymentToken: token,
          paymentPayload: payload,
          paidAt: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        orderId: updated.id,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
        paidAt: updated.paidAt,
      });
    }

    const failureMessage =
      body?.error ?? payload?.errorMessage ?? payload?.message ?? "Pago no aprobado";

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "FAILED",
        paymentProvider: provider,
        paymentToken: token,
        paymentPayload: {
          ...payload,
          status: normalizedStatus || "FAILED",
          errorMessage: failureMessage,
        },
        paidAt: null,
      },
    });

    return NextResponse.json(
      { ok: false, error: failureMessage },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Error procesando el pago" },
      { status: 400 }
    );
  }
}

function resolveStoredTotals(order: any) {
  const subtotal = order.subtotal
    ? Number(order.subtotal)
    : order.items.reduce(
        (acc: number, item: any) => acc + Number(item.unitPrice) * item.quantity,
        0
      );
  const discount = order.discountTotal ? Number(order.discountTotal) : 0;
  const shipping = order.shippingTotal ? Number(order.shippingTotal) : 0;
  const total = order.total ? Number(order.total) : subtotal - discount + shipping;

  return { subtotal, discount, shipping, total };
}

function parseAmount(value: unknown): number | null {
  if (value == null) return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  return num;
}

function nearlyEqual(a: number, b: number) {
  return Math.abs(a - b) <= 0.01;
}

function sanitizeJson(value: any) {
  try {
    return JSON.parse(JSON.stringify(value ?? {}));
  } catch (e) {
    return {};
  }
}
