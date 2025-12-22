import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageUsers } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { AdminUserInputSchema } from "@/lib/validation/admin-users";
import { upsertAdminPermissions, deleteAdminPermissions } from "@/lib/admin-permissions";

// GET - Listar todos los usuarios admin
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que el usuario puede gestionar usuarios (solo OWNER)
    const canManage = await canManageUsers(session.user.id);
    if (!canManage) {
      return NextResponse.json(
        { error: "No tienes permisos para gestionar usuarios" },
        { status: 403 }
      );
    }

    // Obtener todos los usuarios admin (OWNER y ADMIN)
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ["OWNER", "ADMIN"],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        twoFactorEnabled: true,
        createdAt: true,
        adminPermission: {
          select: {
            canManagePayphone: true,
            canManageUsers: true,
            canManageBankAccounts: true,
            canManageCoupons: true,
            canDeleteProducts: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // OWNER primero
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({
      users: adminUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt.toISOString(),
        permissions: user.adminPermission
          ? {
              canManagePayphone: user.adminPermission.canManagePayphone,
              canManageUsers: user.adminPermission.canManageUsers,
              canManageBankAccounts: user.adminPermission.canManageBankAccounts,
              canManageCoupons: user.adminPermission.canManageCoupons,
              canDeleteProducts: user.adminPermission.canDeleteProducts,
            }
          : null,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { error: "Error al cargar los usuarios admin" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo usuario admin
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que el usuario puede gestionar usuarios (solo OWNER)
    const canManage = await canManageUsers(session.user.id);
    if (!canManage) {
      return NextResponse.json(
        { error: "No tienes permisos para crear usuarios admin" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validar input
    const validationResult = AdminUserInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validar que el email existe en la BD (debe haberse logueado al menos una vez)
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "El usuario no existe. Debe iniciar sesión al menos una vez antes de ser promovido a admin." },
        { status: 404 }
      );
    }

    // Validar que no es ya admin
    if (existingUser.role === "ADMIN" || existingUser.role === "OWNER") {
      return NextResponse.json(
        { error: "Este usuario ya es administrador" },
        { status: 400 }
      );
    }

    // Validar que no se puede crear OWNER desde la UI (solo ADMIN)
    if (data.role === "OWNER") {
      return NextResponse.json(
        { error: "No se puede crear un usuario OWNER desde la interfaz" },
        { status: 400 }
      );
    }

    // Actualizar rol del usuario a ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: "ADMIN",
      },
    });

    // Crear permisos por defecto si se especificaron
    if (data.permissions) {
      await upsertAdminPermissions(existingUser.id, data.permissions);
    } else {
      // Crear permisos por defecto para ADMIN
      await upsertAdminPermissions(existingUser.id, {
        canManagePayphone: false,
        canManageUsers: false,
        canManageBankAccounts: true,
        canManageCoupons: true,
        canDeleteProducts: true,
      });
    }

    // Obtener permisos creados
    const permissions = await prisma.adminPermission.findUnique({
      where: { userId: existingUser.id },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        createdAt: updatedUser.createdAt.toISOString(),
        permissions: permissions
          ? {
              canManagePayphone: permissions.canManagePayphone,
              canManageUsers: permissions.canManageUsers,
              canManageBankAccounts: permissions.canManageBankAccounts,
              canManageCoupons: permissions.canManageCoupons,
              canDeleteProducts: permissions.canDeleteProducts,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear el usuario admin" },
      { status: 500 }
    );
  }
}

