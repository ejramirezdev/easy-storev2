import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageUsers, isOwner, getUserRole } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { UpdateAdminUserInputSchema } from "@/lib/validation/admin-users";
import { upsertAdminPermissions, deleteAdminPermissions } from "@/lib/admin-permissions";

// PUT - Actualizar usuario admin
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "No tienes permisos para modificar usuarios" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    // Validar input
    const validationResult = UpdateAdminUserInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verificar que el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Validaciones de seguridad

    // 1. No se puede cambiar el rol del último OWNER
    if (targetUser.role === "OWNER" && data.role !== "OWNER") {
      const ownerCount = await prisma.user.count({
        where: { role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "No se puede cambiar el rol del último OWNER" },
          { status: 400 }
        );
      }
    }

    // 2. No se puede auto-modificar (cambiar tu propio rol)
    if (id === session.user.id && data.role !== targetUser.role) {
      return NextResponse.json(
        { error: "No puedes cambiar tu propio rol" },
        { status: 400 }
      );
    }

    // 3. No se puede crear OWNER desde la UI
    if (data.role === "OWNER" && targetUser.role !== "OWNER") {
      return NextResponse.json(
        { error: "No se puede asignar el rol OWNER desde la interfaz" },
        { status: 400 }
      );
    }

    // Actualizar rol si cambió
    let updatedUser = targetUser;
    if (data.role !== targetUser.role) {
      updatedUser = await prisma.user.update({
        where: { id },
        data: {
          role: data.role,
        },
      });

      // Si se cambió a CUSTOMER, eliminar permisos
      if (data.role === "CUSTOMER") {
        await deleteAdminPermissions(id);
      }
    }

    // Actualizar permisos individuales (solo si es ADMIN)
    if (data.role === "ADMIN" && data.permissions) {
      await upsertAdminPermissions(id, data.permissions);
    } else if (data.role === "OWNER") {
      // OWNER no necesita permisos individuales, eliminar si existen
      await deleteAdminPermissions(id);
    }

    // Obtener usuario actualizado con permisos
    const userWithPermissions = await prisma.user.findUnique({
      where: { id },
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
    });

    return NextResponse.json({
      user: {
        id: userWithPermissions!.id,
        email: userWithPermissions!.email,
        name: userWithPermissions!.name,
        role: userWithPermissions!.role,
        twoFactorEnabled: userWithPermissions!.twoFactorEnabled,
        createdAt: userWithPermissions!.createdAt.toISOString(),
        permissions: userWithPermissions!.adminPermission
          ? {
              canManagePayphone: userWithPermissions!.adminPermission.canManagePayphone,
              canManageUsers: userWithPermissions!.adminPermission.canManageUsers,
              canManageBankAccounts: userWithPermissions!.adminPermission.canManageBankAccounts,
              canManageCoupons: userWithPermissions!.adminPermission.canManageCoupons,
              canDeleteProducts: userWithPermissions!.adminPermission.canDeleteProducts,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Error updating admin user:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar el usuario" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar usuario admin (cambiar a CUSTOMER)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "No tienes permisos para eliminar usuarios" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Validaciones de seguridad

    // 1. No se puede eliminar el último OWNER
    if (targetUser.role === "OWNER") {
      const ownerCount = await prisma.user.count({
        where: { role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "No se puede eliminar el último OWNER" },
          { status: 400 }
        );
      }
    }

    // 2. No se puede auto-eliminar
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta de administrador" },
        { status: 400 }
      );
    }

    // Cambiar rol a CUSTOMER
    await prisma.user.update({
      where: { id },
      data: {
        role: "CUSTOMER",
      },
    });

    // Eliminar permisos
    await deleteAdminPermissions(id);

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado correctamente",
    });
  } catch (error: any) {
    console.error("Error deleting admin user:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Error al eliminar el usuario" },
      { status: 500 }
    );
  }
}

