import { z } from "zod";

export const AdminUserInputSchema = z.object({
  email: z
    .string({ required_error: "El email es requerido" })
    .email("Email inválido")
    .toLowerCase()
    .trim(),
  role: z.enum(["ADMIN", "OWNER"], {
    required_error: "El rol es requerido",
    invalid_type_error: "Rol inválido",
  }),
  permissions: z
    .object({
      canManagePayphone: z.boolean().optional().default(false),
      canManageUsers: z.boolean().optional().default(false),
      canManageBankAccounts: z.boolean().optional().default(true),
      canManageCoupons: z.boolean().optional().default(true),
      canDeleteProducts: z.boolean().optional().default(true),
    })
    .optional(),
});

export const UpdateAdminUserInputSchema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN", "OWNER"], {
    required_error: "El rol es requerido",
    invalid_type_error: "Rol inválido",
  }),
  permissions: z
    .object({
      canManagePayphone: z.boolean().optional(),
      canManageUsers: z.boolean().optional(),
      canManageBankAccounts: z.boolean().optional(),
      canManageCoupons: z.boolean().optional(),
      canDeleteProducts: z.boolean().optional(),
    })
    .optional(),
});

export type AdminUserInput = z.infer<typeof AdminUserInputSchema>;
export type UpdateAdminUserInput = z.infer<typeof UpdateAdminUserInputSchema>;

