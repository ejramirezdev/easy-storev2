import { z } from "zod";

const priceSchema = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      const parsed = Number(val.replace(/,/g, "."));
      return Number.isFinite(parsed) ? parsed : val;
    }
    return val;
  },
  z
    .number({ invalid_type_error: "Precio inválido" })
    .min(0, { message: "El precio no puede ser negativo" })
    .refine((n) => !Number.isNaN(n), "Precio inválido")
);

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
    .min(3, "Debe tener al menos 3 caracteres")
    .max(200, "Máximo 200 caracteres"),
  slug: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        // Permitir slug vacío, undefined o null (se generará automáticamente)
        if (!val || val.length === 0) return true;
        // Si tiene valor, debe cumplir con los requisitos
        return val.length >= 3 && val.length <= 120;
      },
      {
        message: "Debe tener entre 3 y 120 caracteres si se especifica",
      }
    ),
  description: z
    .string()
    .trim()
    .max(5000, "Máximo 5000 caracteres")
    .optional()
    .nullable(),
  price: priceSchema,
  stock: stockSchema,
  imageUrl: nullableUrlSchema.optional(),
  categoryId: z
    .string({ invalid_type_error: "Categoría inválida" })
    .uuid("Selecciona una categoría válida")
    .optional()
    .nullable(),
  images: z.array(ProductImageInputSchema).optional(),
  isFeatured: z.boolean().optional().default(false),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;
export type ProductImageInput = z.infer<typeof ProductImageInputSchema>;
