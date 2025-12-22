-- Script de migración de datos
-- Convierte ejramirezdev@gmail.com a rol OWNER
-- Crea permisos por defecto para usuarios admin existentes

-- 1. Convertir ejramirezdev@gmail.com a OWNER
UPDATE "User" 
SET "role" = 'OWNER' 
WHERE "email" = 'ejramirezdev@gmail.com';

-- 2. Crear permisos por defecto para todos los usuarios ADMIN existentes
-- (OWNER no necesita permisos individuales ya que tiene todos)
INSERT INTO "AdminPermission" ("id", "userId", "canManagePayphone", "canManageUsers", "canManageBankAccounts", "canManageCoupons", "canDeleteProducts", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  u."id",
  false,  -- ADMIN no puede gestionar Payphone por defecto
  false,  -- ADMIN no puede gestionar usuarios por defecto
  true,   -- ADMIN puede gestionar cuentas bancarias por defecto
  true,   -- ADMIN puede gestionar cupones por defecto
  true,   -- ADMIN puede eliminar productos por defecto
  NOW(),
  NOW()
FROM "User" u
WHERE u."role" = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM "AdminPermission" ap WHERE ap."userId" = u."id"
  );

