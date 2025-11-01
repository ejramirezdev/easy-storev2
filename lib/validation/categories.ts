import { z } from "zod";

export const CategoryInputSchema = z.object({
  name: z
    .string({ required_error: "Ingresa un nombre" })
    .trim()
    .min(3, "Debe tener al menos 3 caracteres")
    .max(80, "Máximo 80 caracteres"),
  slug: z
    .string()
    .trim()
    .max(120, "Máximo 120 caracteres")
    .refine((value) => value.length === 0 || value.length >= 2, {
      message: "Debe tener al menos 2 caracteres",
    })
    .optional(),
});

export type CategoryInput = z.infer<typeof CategoryInputSchema>;
