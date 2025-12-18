import { z } from "zod";

const couponValueSchema = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      const parsed = Number(val.replace(/,/g, "."));
      return Number.isFinite(parsed) ? parsed : val;
    }
    return val;
  },
  z
    .number({ invalid_type_error: "Valor inválido" })
    .min(0, { message: "El valor no puede ser negativo" })
    .refine((n) => !Number.isNaN(n), "Valor inválido")
);

const nullableDecimalSchema = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return null;
    if (typeof val === "string") {
      const parsed = Number(val.replace(/,/g, "."));
      return Number.isFinite(parsed) ? parsed : null;
    }
    return val;
  },
  z
    .number({ invalid_type_error: "Valor inválido" })
    .min(0, { message: "El valor no puede ser negativo" })
    .nullable()
    .optional()
);

const nullableIntSchema = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return null;
    if (typeof val === "string") {
      const parsed = Number(val);
      return Number.isFinite(parsed) && Number.isInteger(parsed) ? parsed : null;
    }
    return val;
  },
  z
    .number({ invalid_type_error: "Valor inválido" })
    .int("Debe ser un número entero")
    .min(1, { message: "Debe ser mayor a 0" })
    .nullable()
    .optional()
);

export const CouponInputSchema = z
  .object({
    code: z
      .string({ required_error: "Ingresa un código" })
      .trim()
      .min(3, "El código debe tener al menos 3 caracteres")
      .max(50, "El código no puede exceder 50 caracteres")
      .regex(/^[A-Z0-9-_]+$/, "Solo se permiten letras mayúsculas, números, guiones y guiones bajos")
      .transform((val) => val.toUpperCase()),
    type: z.enum(["PERCENT", "FIXED", "FREESHIP"], {
      required_error: "Selecciona un tipo de cupón",
      invalid_type_error: "Tipo de cupón inválido",
    }),
    value: couponValueSchema,
    minSubtotal: nullableDecimalSchema,
    startsAt: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .or(z.date().nullable().optional())
      .transform((val) => (val ? new Date(val) : null)),
    endsAt: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .or(z.date().nullable().optional())
      .transform((val) => (val ? new Date(val) : null)),
    maxUses: nullableIntSchema,
    perUserLimit: nullableIntSchema,
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      // Para PERCENT, el valor debe estar entre 0 y 100
      if (data.type === "PERCENT" && (data.value < 0 || data.value > 100)) {
        return false;
      }
      // Para FIXED, el valor debe ser mayor a 0
      if (data.type === "FIXED" && data.value <= 0) {
        return false;
      }
      // Para FREESHIP, el valor puede ser cualquier número >= 0 (aunque no se usa en el cálculo)
      return true;
    },
    {
      message: "Para cupones de porcentaje, el valor debe estar entre 0 y 100. Para cupones de cantidad fija, debe ser mayor a 0.",
      path: ["value"],
    }
  )
  .refine(
    (data) => {
      // Validar que endsAt sea posterior a startsAt si ambos están presentes
      if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
        return false;
      }
      return true;
    },
    {
      message: "La fecha de fin debe ser posterior a la fecha de inicio",
      path: ["endsAt"],
    }
  );

export type CouponInput = z.infer<typeof CouponInputSchema>;

