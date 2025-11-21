import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { prisma } from "./prisma";

// Re-exportar isAdminEmail desde admin-utils para compatibilidad
export { isAdminEmail } from "./admin-utils";

/**
 * Genera un secret para 2FA TOTP
 */
export function generateTwoFactorSecret(email: string, serviceName: string = "Easy Store Admin") {
  const secret = speakeasy.generateSecret({
    name: `${serviceName} (${email})`,
    issuer: "Easy Store",
    length: 32,
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
}

/**
 * Genera un código QR en formato data URL para el secret de 2FA
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generando QR code:", error);
    throw new Error("Error al generar código QR");
  }
}

/**
 * Verifica un código TOTP contra el secret almacenado
 */
export async function verifyTwoFactorCode(
  userId: string,
  code: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 2, // Permite códigos de ±2 intervalos de tiempo (60 segundos cada uno)
    });

    return verified === true;
  } catch (error) {
    console.error("Error verificando código 2FA:", error);
    return false;
  }
}

/**
 * Genera códigos de respaldo para 2FA
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Genera códigos de 8 dígitos
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    codes.push(code);
  }
  return codes;
}

/**
 * Verifica si un código de respaldo es válido
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorBackupCodes: true },
    });

    if (!user || !user.twoFactorBackupCodes) {
      return false;
    }

    let backupCodes: string[] = [];
    try {
      backupCodes = JSON.parse(user.twoFactorBackupCodes);
    } catch {
      return false;
    }

    const index = backupCodes.indexOf(code);
    if (index === -1) {
      return false;
    }

    // Remover el código usado
    backupCodes.splice(index, 1);
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    });

    return true;
  } catch (error) {
    console.error("Error verificando código de respaldo:", error);
    return false;
  }
}

/**
 * Verifica si un usuario tiene 2FA habilitado
 */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    return user?.twoFactorEnabled ?? false;
  } catch (error) {
    console.error("Error verificando estado 2FA:", error);
    return false;
  }
}
