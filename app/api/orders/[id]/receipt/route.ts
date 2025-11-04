import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import nodemailer from "nodemailer";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, name: true } },
        items: {
          include: {
            product: { select: { name: true } },
            service: { select: { name: true } },
          },
        },
        addresses: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Verificar que el usuario sea el dueño de la orden
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que el método de pago sea BANK_TRANSFER
    if (order.paymentMethod !== "BANK_TRANSFER") {
      return NextResponse.json(
        { error: "Esta orden no está configurada para transferencia bancaria" },
        { status: 400 }
      );
    }

    // Obtener el archivo del FormData
    const formData = await req.formData();
    const receiptFile = formData.get("receipt") as File | null;

    if (!receiptFile) {
      return NextResponse.json(
        { error: "No se proporcionó el comprobante" },
        { status: 400 }
      );
    }

    // Validar que sea una imagen
    if (!receiptFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileExtension = receiptFile.name.split(".").pop() || "jpg";
    const fileName = `${id}-${timestamp}.${fileExtension}`;

    // Ruta donde se guardará el archivo (public/receipts)
    const receiptsDir = join(process.cwd(), "public", "receipts");
    const filePath = join(receiptsDir, fileName);

    // Asegurar que el directorio existe
    await mkdir(receiptsDir, { recursive: true });

    // Convertir File a Buffer y guardarlo
    const bytes = await receiptFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL relativa para acceder al archivo
    const receiptUrl = `/receipts/${fileName}`;

    // Actualizar la orden con la URL del comprobante, cambiar estado a REVIEW y marcar fecha de carga
    await prisma.order.update({
      where: { id },
      data: {
        receiptUrl,
        receiptUploadedAt: new Date(),
        status: "REVIEW",
      },
    });

    // Enviar email al administrador
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPassRaw = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
    const smtpPass = smtpPassRaw ? smtpPassRaw.replace(/\s/g, "") : "";

    if (smtpUser && smtpPass) {
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

      const shippingAddress = order.addresses.find((a) => a.type === "SHIPPING");
      const billingAddress = order.addresses.find((a) => a.type === "BILLING");

      const orderItemsText = order.items
        .map((item) => {
          const itemName = item.product?.name ?? item.service?.name ?? "Producto";
          return `- ${itemName} × ${item.quantity} - $${(Number(item.unitPrice) * item.quantity).toFixed(2)}`;
        })
        .join("\n");

      const bankNames: Record<string, string> = {
        GUAYAQUIL: "Banco Guayaquil",
        PICHINCHA: "Banco Pichincha",
        PACIFICO: "Banco del Pacífico",
      };

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Nuevo Pago por Transferencia Bancaria - Revisión Requerida</h2>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #666; margin-bottom: 10px;">Información de la Orden</h3>
              <p style="color: #666; margin: 5px 0;"><strong>ID de Orden:</strong> ${order.id}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Estado:</strong> EN REVISIÓN</p>
              <p style="color: #666; margin: 5px 0;"><strong>Total:</strong> $${Number(order.total).toFixed(2)}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Banco:</strong> ${order.selectedBank ? bankNames[order.selectedBank] || order.selectedBank : "No especificado"}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #666; margin-bottom: 10px;">Cliente</h3>
              <p style="color: #666; margin: 5px 0;"><strong>Nombre:</strong> ${order.user.name || "N/A"}</p>
              <p style="color: #666; margin: 5px 0;"><strong>Email:</strong> ${order.user.email}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #666; margin-bottom: 10px;">Artículos</h3>
              <pre style="color: #333; background-color: #f9f9f9; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${orderItemsText}</pre>
            </div>

            ${shippingAddress ? `
            <div style="margin: 20px 0;">
              <h3 style="color: #666; margin-bottom: 10px;">Dirección de Envío</h3>
              <p style="color: #333;">${shippingAddress.firstName} ${shippingAddress.lastName}</p>
              <p style="color: #333;">${shippingAddress.street}</p>
              <p style="color: #333;">${shippingAddress.city}, ${shippingAddress.state}</p>
              <p style="color: #333;">${shippingAddress.country}</p>
              ${shippingAddress.phone ? `<p style="color: #333;">Tel: ${shippingAddress.phone}</p>` : ""}
            </div>
            ` : ""}

            <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">
              <p style="color: #856404; margin: 0;"><strong>⚠️ Acción Requerida:</strong> Por favor verifica el comprobante de transferencia adjunto y confirma el pago en el panel de administración.</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 5px 0;">Fecha: ${new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}</p>
              <p style="color: #999; font-size: 12px; margin: 5px 0;">
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/orders" style="color: #1976d2;">
                  Ver orden en el panel de administración
                </a>
              </p>
            </div>
          </div>
        </div>
      `;

      const textContent = `
Nuevo Pago por Transferencia Bancaria - Revisión Requerida

ID de Orden: ${order.id}
Estado: EN REVISIÓN
Total: $${Number(order.total).toFixed(2)}
Banco: ${order.selectedBank ? bankNames[order.selectedBank] || order.selectedBank : "No especificado"}

Cliente:
Nombre: ${order.user.name || "N/A"}
Email: ${order.user.email}

Artículos:
${orderItemsText}

${shippingAddress ? `
Dirección de Envío:
${shippingAddress.firstName} ${shippingAddress.lastName}
${shippingAddress.street}
${shippingAddress.city}, ${shippingAddress.state}
${shippingAddress.country}
${shippingAddress.phone ? `Tel: ${shippingAddress.phone}` : ""}
` : ""}

⚠️ Acción Requerida: Por favor verifica el comprobante de transferencia adjunto y confirma el pago en el panel de administración.

Fecha: ${new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}
      `;

      // Obtener la ruta absoluta del archivo para adjuntarlo
      const absoluteFilePath = join(process.cwd(), "public", receiptUrl);

      await transporter.sendMail({
        from: `"Easy Store" <${fromEmail}>`,
        to: recipientEmail,
        subject: `Pago por Transferencia - Orden #${order.id.slice(0, 8).toUpperCase()} - Revisión Requerida`,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: `comprobante-${order.id.slice(0, 8)}.${fileExtension}`,
            path: absoluteFilePath,
          },
        ],
      });
    }

    return NextResponse.json({ ok: true, receiptUrl });
  } catch (error: any) {
    console.error("Error uploading receipt:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir el comprobante" },
      { status: 500 }
    );
  }
}
