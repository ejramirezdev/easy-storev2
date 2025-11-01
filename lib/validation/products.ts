import { z } from "zod";

const priceSchema = z
  .preprocess((val) => {
    if (typeof val === "string") {
      const parsed = Number(val.replace(/,/g, "."));
      return Number.isFinite(parsed) ? parsed : val;
    }
    return val;
  }, z.number({ invalid_type_error: "Precio inválido" }).refine((n) => !Number.isNaN(n), "Precio inválido"))
  .nonnegative("El precio no puede ser negativo");

const stockSchema = z
  .preprocess((val) => {
    if (typeof val === "string") {
      const parsed = Number(val);
      return Number.isFinite(parsed) ? parsed : val;
    }
    return val;
  }, z.number({ invalid_type_error: "Stock inválido" }).int("El stock debe ser un entero").min(0, "El stock debe ser mayor o igual a 0"));

const nullableUrlSchema = z
  .preprocess((val) => {
    if (typeof val === "string") {
      const trimmed = val.trim();
      return trimmed.length === 0 ? null : trimmed;
    }
    return val ?? null;
  }, z.string().url("URL inválida").nullable());

export const ProductImageInputSchema = z.object({
  id: z.string().uuid().optional(),
  url: z
    .string({ required_error: "Ingresa la URL de la imagen" })
    .trim()
    .url("Ingresa una URL válida"),
  alt: z
    .string()
    .trim()
    .max(140, "Máximo 140 caracteres")
    .optional()
    .nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const ProductInputSchema = z.object({
  name: z
    .string({ required_error: "Ingresa un título" })
    .trim()
    .min(3, "Debe tener al menos 3 caracteres"),
  slug: z
    .string()
    .trim()
    .min(3, "Debe tener al menos 3 caracteres")
    .max(120, "Máximo 120 caracteres")
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, "Máximo 5000 caracteres")
    .optional()
    .nullable(),
  price: priceSchema,
  stock: stockSchema,
  imageUrl: nullableUrlSchema.optional(),
  images: z.array(ProductImageInputSchema).optional(),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;
export type ProductImageInput = z.infer<typeof ProductImageInputSchema>;
