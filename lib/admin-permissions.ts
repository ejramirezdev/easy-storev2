/**
 * Sistema de permisos para administradores
 * Implementa lógica híbrida: permisos base por rol + permisos individuales opcionales
 */

import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export type Permission = 
  | "canManagePayphone"
  | "canManageUsers"
  | "canManageBankAccounts"
  | "canManageCoupons"
  | "canDeleteProducts";

export type UserPermissions = {
  role: Role;
  canManagePayphone: boolean;
  canManageUsers: boolean;
  canManageBankAccounts: boolean;
  canManageCoupons: boolean;
  canDeleteProducts: boolean;
};

/**
 * Obtiene el rol del usuario desde la base de datos
 */
export async function getUserRole(userId: string): Promise<Role | null> {
  try {
    if (!prisma) return null;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    
    return user?.role ?? null;
  } catch (error) {
    console.error("Error obteniendo rol del usuario:", error);
    return null;
  }
}

/**
 * Verifica si el usuario es OWNER
 */
export async function isOwner(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "OWNER";
}

/**
 * Verifica si el usuario es ADMIN o OWNER
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "ADMIN" || role === "OWNER";
}

/**
 * Verifica si el usuario es ADMIN (no OWNER)
 */
export async function isAdminRole(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "ADMIN";
}

/**
 * Obtiene todos los permisos del usuario (rol + permisos individuales)
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  try {
    if (!prisma) return null;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        adminPermission: true,
      },
    });
    
    if (!user) return null;
    
    const role = user.role;
    
    // OWNER tiene todos los permisos siempre
    if (role === "OWNER") {
      return {
        role: "OWNER",
        canManagePayphone: true,
        canManageUsers: true,
        canManageBankAccounts: true,
        canManageCoupons: true,
        canDeleteProducts: true,
      };
    }
    
    // ADMIN: permisos base + permisos individuales
    if (role === "ADMIN") {
      const individualPermissions = user.adminPermission;
      
      return {
        role: "ADMIN",
        canManagePayphone: individualPermissions?.canManagePayphone ?? false,
        canManageUsers: individualPermissions?.canManageUsers ?? false,
        canManageBankAccounts: individualPermissions?.canManageBankAccounts ?? true,
        canManageCoupons: individualPermissions?.canManageCoupons ?? true,
        canDeleteProducts: individualPermissions?.canDeleteProducts ?? true,
      };
    }
    
    // CUSTOMER no tiene permisos
    return {
      role: "CUSTOMER",
      canManagePayphone: false,
      canManageUsers: false,
      canManageBankAccounts: false,
      canManageCoupons: false,
      canDeleteProducts: false,
    };
  } catch (error) {
    console.error("Error obteniendo permisos del usuario:", error);
    return null;
  }
}

/**
 * Verifica si el usuario tiene un permiso específico
 */
export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  if (!permissions) return false;
  
  return permissions[permission] ?? false;
}

/**
 * Verifica si el usuario puede acceder a la configuración de Payphone
 */
export async function canAccessPayphone(userId: string): Promise<boolean> {
  return hasPermission(userId, "canManagePayphone");
}

/**
 * Verifica si el usuario puede gestionar otros usuarios admin
 */
export async function canManageUsers(userId: string): Promise<boolean> {
  return hasPermission(userId, "canManageUsers");
}

/**
 * Verifica si el usuario puede gestionar cuentas bancarias
 */
export async function canManageBankAccounts(userId: string): Promise<boolean> {
  return hasPermission(userId, "canManageBankAccounts");
}

/**
 * Verifica si el usuario puede gestionar cupones
 */
export async function canManageCoupons(userId: string): Promise<boolean> {
  return hasPermission(userId, "canManageCoupons");
}

/**
 * Verifica si el usuario puede eliminar productos
 */
export async function canDeleteProducts(userId: string): Promise<boolean> {
  return hasPermission(userId, "canDeleteProducts");
}

/**
 * Crea o actualiza permisos individuales para un usuario ADMIN
 */
export async function upsertAdminPermissions(
  userId: string,
  permissions: {
    canManagePayphone?: boolean;
    canManageUsers?: boolean;
    canManageBankAccounts?: boolean;
    canManageCoupons?: boolean;
    canDeleteProducts?: boolean;
  }
): Promise<void> {
  try {
    if (!prisma) throw new Error("Prisma Client no está inicializado");
    
    // Verificar que el usuario es ADMIN (no OWNER)
    const role = await getUserRole(userId);
    if (role !== "ADMIN") {
      throw new Error("Solo los usuarios ADMIN pueden tener permisos individuales");
    }
    
    await prisma.adminPermission.upsert({
      where: { userId },
      update: {
        canManagePayphone: permissions.canManagePayphone,
        canManageUsers: permissions.canManageUsers,
        canManageBankAccounts: permissions.canManageBankAccounts,
        canManageCoupons: permissions.canManageCoupons,
        canDeleteProducts: permissions.canDeleteProducts,
        updatedAt: new Date(),
      },
      create: {
        userId,
        canManagePayphone: permissions.canManagePayphone ?? false,
        canManageUsers: permissions.canManageUsers ?? false,
        canManageBankAccounts: permissions.canManageBankAccounts ?? true,
        canManageCoupons: permissions.canManageCoupons ?? true,
        canDeleteProducts: permissions.canDeleteProducts ?? true,
      },
    });
  } catch (error) {
    console.error("Error actualizando permisos:", error);
    throw error;
  }
}

/**
 * Elimina permisos individuales de un usuario (cuando se elimina como admin)
 */
export async function deleteAdminPermissions(userId: string): Promise<void> {
  try {
    if (!prisma) return;
    
    await prisma.adminPermission.deleteMany({
      where: { userId },
    });
  } catch (error) {
    console.error("Error eliminando permisos:", error);
    // No lanzar error, puede que no existan permisos
  }
}

