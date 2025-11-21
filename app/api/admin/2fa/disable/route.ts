import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-utils";
import { verifyTwoFactorCode } from "@/lib/admin";
import { logAdminAction, getClientIP, getClientUserAgent } from "@/lib/admin-logging";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const disableSchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!session.user.id) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 400 });
    }

    const body = await req.json();
    const { code } = disableSchema.parse(body);

    // Verificar el código antes de desactivar
    const verified = await verifyTwoFactorCode(session.user.id, code);

    if (!verified) {
      return NextResponse.json(
        { error: "Código inválido. No se puede desactivar 2FA." },
        { status: 400 }
      );
    }

    // Desactivar 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    // Log de desactivación de 2FA
    await logAdminAction({
      userId: session.user.id,
      email: session.user.email,
      action: "2FA_DISABLE",
      ipAddress: getClientIP(req),
      userAgent: getClientUserAgent(req),
    });

    return NextResponse.json({
      success: true,
      message: "2FA desactivado correctamente",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error desactivando 2FA:", error);
    return NextResponse.json(
      { error: error.message || "Error al desactivar 2FA" },
      { status: 500 }
    );
  }
}

