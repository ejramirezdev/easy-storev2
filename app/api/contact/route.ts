import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { escapeHtml, sanitizeEmail, sanitizeForEmail } from "@/lib/security/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { z } from "zod";

const contactSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
  email: z.string().email().max(254),
  phone: z.string().min(1).max(20),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`contact:${ip}`, 5, 60000); // 5 requests por minuto
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: "Demasiadas solicitudes. Por favor intenta más tarde." },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validar con Zod
    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos", issues: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { subject, message, email, phone } = validation.data;
    
    // Sanitizar email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        { ok: false, error: "Email inválido" },
        { status: 400 }
      );
    }

    // Configurar transporter de nodemailer
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPassRaw = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
    const smtpPass = smtpPassRaw ? smtpPassRaw.replace(/\s/g, "") : "";

    // Validar que las credenciales existan
    if (!smtpUser || !smtpPass) {
      console.error("SMTP credentials missing:", {
        hasUser: !!smtpUser,
        hasPass: !!smtpPassRaw,
        envKeys: Object.keys(process.env).filter(
          (k) => k.includes("SMTP") || k.includes("EMAIL")
        ),
      });
      return NextResponse.json(
        {
          ok: false,
          error:
            "Error de configuración del servidor: las credenciales de email no están configuradas. Por favor contacta al administrador.",
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const recipientEmail = process.env.EMAIL_NOTIFICATIONS_TO || process.env.NEXT_PUBLIC_COMPANY_EMAIL || "easystoreecu@gmail.com";
    const fromEmail = process.env.SMTP_FROM || smtpUser;

    // Sanitizar todos los datos para prevenir XSS
    const safeSubject = escapeHtml(subject);
    const safeMessage = sanitizeForEmail(message);
    const safeEmail = escapeHtml(sanitizedEmail);
    const safePhone = escapeHtml(phone);
    
    // Crear contenido del correo (todos los datos están sanitizados)
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Nuevo Mensaje de Contacto</h2>
          
          <div style="margin: 20px 0;">
            <p style="color: #666; margin: 10px 0;"><strong>Asunto:</strong> ${safeSubject}</p>
            <p style="color: #666; margin: 10px 0;"><strong>Correo electrónico:</strong> ${safeEmail}</p>
            <p style="color: #666; margin: 10px 0;"><strong>Teléfono:</strong> ${safePhone}</p>
            <p style="color: #666; margin: 10px 0;"><strong>Mensaje:</strong></p>
            <p style="color: #333; background-color: #f9f9f9; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">Fecha: ${new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}</p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
Nuevo Mensaje de Contacto

Asunto: ${subject}
Correo electrónico: ${sanitizedEmail}
Teléfono: ${phone}

Mensaje:
${message}

Fecha: ${new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}
    `;

    await transporter.sendMail({
      from: `"Easy Store" <${fromEmail}>`,
      to: recipientEmail,
      subject: `Contacto - ${safeSubject} - ${safeEmail}`,
      text: textContent,
      html: htmlContent,
      replyTo: sanitizedEmail, // Permite responder directamente al cliente (email ya sanitizado)
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error sending email:", error);
    // No exponer detalles del error al cliente
    return NextResponse.json(
      {
        ok: false,
        error: "Error al procesar la solicitud. Por favor intenta más tarde.",
      },
      { status: 500 }
    );
  }
}
