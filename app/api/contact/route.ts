import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, message, email, phone } = body as {
      subject: string;
      message: string;
      email: string;
      phone: string;
    };

    if (!subject || !message || !email || !phone) {
      return NextResponse.json(
        { ok: false, error: "Todos los campos son requeridos" },
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

    const recipientEmail = "easystoreecu@gmail.com";
    const fromEmail = process.env.SMTP_FROM || smtpUser;

    // Crear contenido del correo
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Nuevo Mensaje de Contacto</h2>
          
          <div style="margin: 20px 0;">
            <p style="color: #666; margin: 10px 0;"><strong>Asunto:</strong> ${subject}</p>
            <p style="color: #666; margin: 10px 0;"><strong>Correo electrónico:</strong> ${email}</p>
            <p style="color: #666; margin: 10px 0;"><strong>Teléfono:</strong> ${phone}</p>
            <p style="color: #666; margin: 10px 0;"><strong>Mensaje:</strong></p>
            <p style="color: #333; background-color: #f9f9f9; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${message}</p>
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
Correo electrónico: ${email}
Teléfono: ${phone}

Mensaje:
${message}

Fecha: ${new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}
    `;

    await transporter.sendMail({
      from: `"Easy Store" <${fromEmail}>`,
      to: recipientEmail,
      subject: `Contacto - ${subject} - ${email}`,
      text: textContent,
      html: htmlContent,
      replyTo: email, // Permite responder directamente al cliente
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Error al enviar el correo",
      },
      { status: 500 }
    );
  }
}
