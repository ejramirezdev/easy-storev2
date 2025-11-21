import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { escapeHtml, sanitizeForEmail } from "@/lib/security/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { validateImageFileAdvanced } from "@/lib/security/file-validation";
import { z } from "zod";

const scheduleSchema = z.object({
  category: z.enum(["HARDWARE", "SOFTWARE"]),
  subcategory: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`schedule:${ip}`, 5, 60000); // 5 requests por minuto
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: "Demasiadas solicitudes. Por favor intenta más tarde." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    
    // Validar campos básicos
    const category = formData.get("category") as string;
    const subcategory = formData.get("subcategory") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;

    // Validar con Zod
    const validation = scheduleSchema.safeParse({
      category,
      subcategory,
      description,
      date,
      time,
    });
    
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos", issues: validation.error.issues },
        { status: 400 }
      );
    }

    // Obtener y validar imágenes
    const images: File[] = [];
    let index = 0;
    while (formData.has(`image_${index}`) && index < 10) { // Limitar a 10 imágenes
      const image = formData.get(`image_${index}`) as File;
      if (image) {
        // Validar cada imagen
        const imgValidation = await validateImageFileAdvanced(image);
        if (imgValidation.valid) {
          images.push(image);
        } else {
          return NextResponse.json(
            { ok: false, error: `Imagen ${index + 1}: ${imgValidation.error}` },
            { status: 400 }
          );
        }
      }
      index++;
    }

    // Configurar transporter de nodemailer
    // Por defecto, si no hay configuración SMTP, usaremos Gmail (requiere contraseña de aplicación)
    // Las contraseñas de aplicación de Google pueden venir con espacios, los eliminamos automáticamente
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

    // Preparar adjuntos de imágenes (sanitizar nombres de archivo)
    const attachments = await Promise.all(
      images.map(async (image, idx) => {
        const buffer = await image.arrayBuffer();
        // Sanitizar nombre de archivo
        const safeName = image.name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 100) || `image_${idx}.jpg`;
        return {
          filename: safeName,
          content: Buffer.from(buffer),
          cid: `image_${idx}`,
        };
      })
    );

    // Formatear fecha y hora
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("es-EC", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Crear HTML del email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7812c6 0%, #6600ff 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #7812c6; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
            .images { margin-top: 20px; }
            .footer { background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Nueva Solicitud de Cita - Hardware</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Tipo de Problema:</div>
                <div class="value">${
                  category === "HARDWARE" ? "Hardware" : "Software"
                }</div>
              </div>
              <div class="field">
                <div class="label">Subcategoría:</div>
                <div class="value">${escapeHtml(subcategory)}</div>
              </div>
              <div class="field">
                <div class="label">Descripción:</div>
                <div class="value">${sanitizeForEmail(description)}</div>
              </div>
              <div class="field">
                <div class="label">Fecha Solicitada:</div>
                <div class="value">${escapeHtml(formattedDate)}</div>
              </div>
              <div class="field">
                <div class="label">Hora Solicitada:</div>
                <div class="value">${escapeHtml(time)}</div>
              </div>
              ${
                images.length > 0
                  ? `
                <div class="images">
                  <div class="label">Imágenes Adjuntas (${images.length}):</div>
                  ${images
                    .map(
                      (img, idx) => `<div style="margin-top: 10px;">
                    <strong>${escapeHtml(img.name.substring(0, 50))}</strong> (${(img.size / 1024).toFixed(
                        2
                      )} KB)
                  </div>`
                    )
                    .join("")}
                </div>
              `
                  : ""
              }
            </div>
            <div class="footer">
              Esta solicitud fue enviada desde el formulario de agendamiento de Easy Store.
            </div>
          </div>
        </body>
      </html>
    `;

    // Texto plano alternativo
    const emailText = `
Nueva Solicitud de Cita - Hardware

Tipo de Problema: ${category === "HARDWARE" ? "Hardware" : "Software"}
Subcategoría: ${subcategory}
Descripción: ${description}
Fecha Solicitada: ${formattedDate}
Hora Solicitada: ${time}
${
  images.length > 0
    ? `Imágenes Adjuntas: ${images.map((img) => img.name).join(", ")}`
    : ""
}

Esta solicitud fue enviada desde el formulario de agendamiento de Easy Store.
    `.trim();

    // Enviar email
    await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        process.env.EMAIL_USER ||
        "noreply@easystore.com",
      to: "easystoreecu@gmail.com",
      subject: `Nueva Solicitud de Cita - ${
        category === "HARDWARE" ? "Hardware" : "Software"
      }: ${subcategory}`,
      text: emailText,
      html: emailHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    return NextResponse.json({
      ok: true,
      message: "Solicitud enviada correctamente",
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    // No exponer detalles del error al cliente
    return NextResponse.json(
      { ok: false, error: "Error al procesar la solicitud. Por favor intenta más tarde." },
      { status: 500 }
    );
  }
}
