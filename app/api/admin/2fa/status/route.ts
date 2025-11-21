import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-utils";
import { isTwoFactorEnabled } from "@/lib/admin";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!session.user.id) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 400 });
    }

    const enabled = await isTwoFactorEnabled(session.user.id);

    return NextResponse.json({
      enabled,
    });
  } catch (error: any) {
    console.error("Error obteniendo estado 2FA:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener estado 2FA" },
      { status: 500 }
    );
  }
}

