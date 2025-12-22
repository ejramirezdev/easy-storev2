import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-utils";
import { generateTwoFactorSecret, generateQRCode } from "@/lib/admin";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const isUserAdmin = await isAdmin(session.user.id);
    if (!isUserAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!session.user.id) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 400 });
    }

    const { secret, otpauthUrl } = generateTwoFactorSecret(session.user.email);
    const qrCodeDataUrl = await generateQRCode(otpauthUrl);

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
    });
  } catch (error: any) {
    console.error("Error en setup 2FA:", error);
    return NextResponse.json(
      { error: error.message || "Error al configurar 2FA" },
      { status: 500 }
    );
  }
}

