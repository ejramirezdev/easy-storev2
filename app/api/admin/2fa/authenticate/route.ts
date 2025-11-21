import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-utils";
import { verifyTwoFactorCode, verifyBackupCode } from "@/lib/admin";
import { generate2FAToken } from "@/lib/admin-2fa-session";
import { logAdminAction, getClientIP, getClientUserAgent } from "@/lib/admin-logging";
import { z } from "zod";

const authenticateSchema = z.object({
  code: z.string().min(6, "Código requerido"),
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
    const { code } = authenticateSchema.parse(body);

    // Intentar verificar como código TOTP primero
    const totpVerified = await verifyTwoFactorCode(session.user.id, code);

    if (totpVerified) {
      // Log de acceso exitoso con 2FA
      await logAdminAction({
        userId: session.user.id,
        email: session.user.email,
        action: "LOGIN_2FA",
        details: { method: "TOTP" },
        ipAddress: getClientIP(req),
        userAgent: getClientUserAgent(req),
      });

      // Generar token temporal de verificación (válido por 30 segundos, un solo uso)
      const token = await generate2FAToken(session.user.id);

      return NextResponse.json({
        success: true,
        message: "Código verificado correctamente",
        token, // Token temporal para acceder al panel admin
      });
    }

    // Si no es TOTP, intentar como código de respaldo
    const backupVerified = await verifyBackupCode(session.user.id, code);

    if (backupVerified) {
      // Log de acceso exitoso con código de respaldo
      await logAdminAction({
        userId: session.user.id,
        email: session.user.email,
        action: "LOGIN_2FA",
        details: { method: "BACKUP_CODE" },
        ipAddress: getClientIP(req),
        userAgent: getClientUserAgent(req),
      });

      // Generar token temporal de verificación (válido por 30 segundos, un solo uso)
      const token = await generate2FAToken(session.user.id);

      return NextResponse.json({
        success: true,
        message: "Código de respaldo verificado correctamente",
        token, // Token temporal para acceder al panel admin
      });
    }

    // Log de intento fallido
    await logAdminAction({
      userId: session.user.id,
      email: session.user.email,
      action: "ACCESS_DENIED",
      details: { reason: "INVALID_2FA_CODE" },
      ipAddress: getClientIP(req),
      userAgent: getClientUserAgent(req),
    });

    return NextResponse.json(
      { error: "Código inválido" },
      { status: 400 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error autenticando con 2FA:", error);
    return NextResponse.json(
      { error: error.message || "Error al autenticar con 2FA" },
      { status: 500 }
    );
  }
}

