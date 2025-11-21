import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-utils";
import { verifyTwoFactorCode, generateBackupCodes } from "@/lib/admin";
import { logAdminAction, getClientIP, getClientUserAgent } from "@/lib/admin-logging";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const verifySchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
  secret: z.string().min(1, "Secret requerido"),
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
    const { code, secret } = verifySchema.parse(body);

    // Verificar el código con el secret proporcionado (antes de guardarlo)
    const speakeasy = require("speakeasy");
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: code,
      window: 2,
    });

    if (!verified) {
      return NextResponse.json(
        { error: "Código inválido. Por favor, intenta de nuevo." },
        { status: 400 }
      );
    }

    // Generar códigos de respaldo
    const backupCodes = generateBackupCodes(8);

    // Guardar el secret y activar 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    });

    // Log de activación de 2FA
    await logAdminAction({
      userId: session.user.id,
      email: session.user.email,
      action: "2FA_ENABLE",
      ipAddress: getClientIP(req),
      userAgent: getClientUserAgent(req),
    });

    return NextResponse.json({
      success: true,
      backupCodes, // Mostrar códigos de respaldo una sola vez
      message: "2FA activado correctamente",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error verificando código 2FA:", error);
    return NextResponse.json(
      { error: error.message || "Error al verificar código 2FA" },
      { status: 500 }
    );
  }
}

