import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const category = formData.get("category") as string;
    const subcategory = formData.get("subcategory") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;

    // Obtener imágenes
    const images: File[] = [];
    let index = 0;
    while (formData.has(`image_${index}`)) {
      const image = formData.get(`image_${index}`) as File;
      if (image) images.push(image);
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

    // Preparar adjuntos de imágenes
    const attachments = await Promise.all(
      images.map(async (image) => {
        const buffer = await image.arrayBuffer();
        return {
          filename: image.name,
          content: Buffer.from(buffer),
          cid: `image_${image.name}`,
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
                <div class="value">${subcategory}</div>
              </div>
              <div class="field">
                <div class="label">Descripción:</div>
                <div class="value">${description.replace(/\n/g, "<br>")}</div>
              </div>
              <div class="field">
                <div class="label">Fecha Solicitada:</div>
                <div class="value">${formattedDate}</div>
              </div>
              <div class="field">
                <div class="label">Hora Solicitada:</div>
                <div class="value">${time}</div>
              </div>
              ${
                images.length > 0
                  ? `
                <div class="images">
                  <div class="label">Imágenes Adjuntas (${images.length}):</div>
                  ${images
                    .map(
                      (img, idx) => `<div style="margin-top: 10px;">
                    <strong>${img.name}</strong> (${(img.size / 1024).toFixed(
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
    return NextResponse.json(
      { ok: false, error: error.message || "Error al enviar el email" },
      { status: 500 }
    );
  }
}
