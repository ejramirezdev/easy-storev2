import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageUsers } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

// GET - Listar usuarios que no son admin (para promoción)
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

    // Obtener usuarios que no son admin
    const nonAdminUsers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limitar a 100 usuarios más recientes
    });

    return NextResponse.json({
      users: nonAdminUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("Error fetching non-admin users:", error);
    return NextResponse.json(
      { error: "Error al cargar los usuarios" },
      { status: 500 }
    );
  }
}

