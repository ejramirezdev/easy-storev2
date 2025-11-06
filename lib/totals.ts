import type { Coupon } from "@prisma/client";

export type CartLine = { price: number; quantity: number };
export type Totals = {
  subtotal: number;
  discount: number;
  tax: number; // Impuesto del 15% del subtotal
  shipping: number;
  total: number;
};

// helpers
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const toNumber = (v: unknown) => (v == null ? 0 : Number(v));

function couponIsCurrentlyValid(c?: Coupon, subtotal?: number) {
  if (!c || !c.isActive) return false;
  const now = new Date();
  if (c.startsAt && c.startsAt > now) return false;
  if (c.endsAt && c.endsAt < now) return false;
  if (c.minSubtotal && toNumber(subtotal) < toNumber(c.minSubtotal))
    return false;
  return true;
}

/**
 * Calcula subtotal, descuento, envío y total.
 * - `lines.price` se asume en dólares (p.ej. 79.99), no en centavos.
 * - Envío plano = 5 por defecto; FREESHIP lo pone en 0.
 * - Si `hasOnlyDigitalProducts` es true (TODOS los productos son digitales), el shipping se excluye (0).
 * - Si hay al menos un producto físico, se cobra shipping.
 */
export function calcTotals(
  lines: CartLine[],
  coupon?: Coupon,
  opts?: { shippingFlat?: number; hasOnlyDigitalProducts?: boolean }
): Totals {
  const shippingFlat = opts?.shippingFlat ?? 5;
  const hasOnlyDigitalProducts = opts?.hasOnlyDigitalProducts ?? false;

  // Subtotal
  const subtotal = round2(
    lines.reduce((a, l) => a + toNumber(l.price) * toNumber(l.quantity), 0)
  );

  // Descuento
  let discount = 0;
  if (couponIsCurrentlyValid(coupon, subtotal)) {
    const value = toNumber(coupon!.value);
    switch (coupon!.type) {
      case "PERCENT": {
        discount = round2(subtotal * (value / 100));
        break;
      }
      case "FIXED": {
        discount = Math.min(subtotal, round2(value));
        break;
      }
      case "FREESHIP": {
        discount = 0; // se refleja en shipping
        break;
      }
      default:
        discount = 0;
    }
  }

  // Shipping
  // Si TODOS los productos son digitales, no se cobra envío
  // Si hay al menos un producto físico, se cobra envío
  // Si hay cupón FREESHIP, no se cobra envío
  let shipping = 0;
  if (!hasOnlyDigitalProducts && subtotal > 0) {
    shipping = shippingFlat;
    if (couponIsCurrentlyValid(coupon, subtotal) && coupon!.type === "FREESHIP") {
      shipping = 0;
    }
  }
  shipping = round2(shipping);

  // Impuesto: calculado internamente desde el precio que ya incluye IVA
  // El precio mostrado al usuario ya incluye el 15% de IVA
  // Calculamos el impuesto para uso interno (ej: Payphone), pero no lo agregamos al total
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const basePrice = round2(subtotalAfterDiscount / 1.15); // Precio base sin IVA
  const tax = round2(subtotalAfterDiscount - basePrice); // Impuesto incluido en el precio

  // Total: subtotal - discount + shipping
  // NO agregamos tax porque ya está incluido en el subtotal
  const total = Math.max(0, round2(subtotal - discount + shipping));

  return { subtotal, discount, tax, shipping, total };
}
