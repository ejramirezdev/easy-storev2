import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-utils";
import { uploadProductImage } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const session = await getServerSession(authOptions);
    if (!session || !isAdminEmail(session.user?.email ?? null)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener archivos del FormData
    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron archivos" },
        { status: 400 }
      );
    }

    // Validar y subir cada archivo
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validar archivo con validación avanzada
      const { validateImageFileAdvanced } = await import(
        "@/lib/security/file-validation"
      );
      const validation = await validateImageFileAdvanced(file);
      if (!validation.valid) {
        errors.push(`Archivo ${i + 1} (${file.name}): ${validation.error}`);
        continue;
      }

      try {
        // Subir a S3 - productId es requerido para organizar las imágenes
        const productId = formData.get("productId")?.toString();
        if (!productId) {
          errors.push(`Archivo ${i + 1} (${file.name}): Se requiere productId`);
          continue;
        }
        const url = await uploadProductImage(file, productId);
        uploadedUrls.push(url);
      } catch (error: any) {
        errors.push(`Archivo ${i + 1} (${file.name}): ${error.message}`);
      }
    }

    // Si todas las subidas fallaron
    if (uploadedUrls.length === 0 && errors.length > 0) {
      return NextResponse.json(
        {
          error: "No se pudo subir ningún archivo",
          details: errors,
        },
        { status: 400 }
      );
    }

    // Retornar URLs y errores si los hay
    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error en upload de imágenes:", error);
    return NextResponse.json(
      { error: error.message || "Error al subir imágenes" },
      { status: 500 }
    );
  }
}

// Configuración para permitir archivos grandes
export const config = {
  api: {
    bodyParser: false,
  },
};
