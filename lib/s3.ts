import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// Configuración del cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  // Forzar el uso del endpoint regional correcto
  forcePathStyle: false,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";
const BUCKET_URL = process.env.AWS_S3_BUCKET_URL || "";

/**
 * Tipos de archivo permitidos
 */
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Valida que el archivo sea una imagen válida (jpg o png)
 * @deprecated Usar validateImageFileAdvanced de @/lib/security/file-validation para validación más robusta
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Solo se permiten imágenes en formato JPG o PNG",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo debe ser menor a ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Genera un nombre único para el archivo
 * @deprecated Usar generateSafeFileName de @/lib/security/file-validation para nombres más seguros
 */
export function generateUniqueFileName(
  prefix: string,
  originalName: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  // Sanitizar extensión
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = ["jpg", "jpeg", "png"].includes(extension) ? extension : "jpg";
  return `${prefix}-${timestamp}-${random}.${safeExtension}`;
}

/**
 * Sube un archivo a S3
 */
export async function uploadToS3(
  file: File | Buffer,
  key: string,
  contentType?: string
): Promise<string> {
  try {
    if (!BUCKET_NAME) {
      throw new Error("AWS_S3_BUCKET_NAME no está configurado");
    }

    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const type = contentType || (file instanceof File ? file.type : "application/octet-stream");

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: type,
        // No usar ACL - el bucket tiene política pública configurada
      },
    });

    await upload.done();

    // Retornar la URL pública del archivo
    return `${BUCKET_URL}/${key}`;
  } catch (error: any) {
    console.error("Error uploading to S3:", error);
    throw new Error(`Error al subir archivo a S3: ${error.message}`);
  }
}

/**
 * Sube una imagen de producto a S3
 * Las imágenes se guardan en products/[productId]/ para mejor organización
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string> {
  // Usar validación avanzada con magic bytes
  const { validateImageFileAdvanced, generateSafeFileName } = await import("@/lib/security/file-validation");
  const validation = await validateImageFileAdvanced(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileName = generateSafeFileName(productId, file.name);
  // Guardar en products/[productId]/ para mejor organización
  const key = `products/${productId}/${fileName}`;

  return await uploadToS3(file, key, file.type);
}

/**
 * Sube un comprobante de transferencia a S3
 * Los comprobantes se guardan en receipts/[orderId]/ para mejor organización
 */
export async function uploadReceipt(file: File, orderId: string): Promise<string> {
  // Usar validación avanzada con magic bytes
  const { validateImageFileAdvanced, generateSafeFileName } = await import("@/lib/security/file-validation");
  const validation = await validateImageFileAdvanced(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileName = generateSafeFileName(`receipt-${orderId}`, file.name);
  // Guardar en receipts/[orderId]/ para mejor organización
  const key = `receipts/${orderId}/${fileName}`;

  return await uploadToS3(file, key, file.type);
}

/**
 * Elimina un archivo de S3
 */
export async function deleteFromS3(url: string): Promise<void> {
  try {
    // Verificar si es una URL de S3
    if (!isS3Url(url)) {
      // No es un archivo de S3, no hacer nada
      return;
    }

    // Extraer la key del URL de diferentes formatos posibles
    let key: string;
    
    if (url.includes(BUCKET_URL)) {
      // Formato: https://bucket-url/path/to/file
      key = url.replace(`${BUCKET_URL}/`, "").split("?")[0]; // Remover query params si existen
    } else if (url.includes(".s3.") || url.includes(".amazonaws.com")) {
      // Formato: https://bucket.s3.region.amazonaws.com/path/to/file
      // O: https://bucket.s3-region.amazonaws.com/path/to/file
      const urlObj = new URL(url);
      key = urlObj.pathname.substring(1); // Remover el primer "/"
    } else {
      // No podemos determinar la key, no hacer nada
      console.warn(`No se pudo extraer la key del URL: ${url}`);
      return;
    }

    if (!key || key.length === 0) {
      console.warn(`Key vacía para URL: ${url}`);
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Imagen eliminada de S3: ${key}`);
  } catch (error: any) {
    console.error(`Error deleting from S3 (URL: ${url}):`, error);
    // No lanzar error, solo logear para no interrumpir el flujo
  }
}

/**
 * Verifica si una URL es de S3
 */
export function isS3Url(url: string): boolean {
  return url.includes(BUCKET_URL) || url.includes(".s3.") || url.includes(".amazonaws.com");
}

/**
 * Elimina todas las imágenes de un producto de S3
 * Se eliminan la imagen principal y todas las imágenes de la galería
 */
export async function deleteProductImagesFromS3(
  imageUrl: string | null,
  galleryUrls: string[]
): Promise<void> {
  const urlsToDelete: string[] = [];

  // Agregar imagen principal si existe y es de S3
  if (imageUrl && isS3Url(imageUrl)) {
    urlsToDelete.push(imageUrl);
  }

  // Agregar imágenes de galería que sean de S3
  galleryUrls.forEach((url) => {
    if (isS3Url(url)) {
      urlsToDelete.push(url);
    }
  });

  // Eliminar todas las imágenes en paralelo
  await Promise.all(urlsToDelete.map((url) => deleteFromS3(url)));
}

/**
 * Descarga una imagen desde una URL externa y la sube a S3
 * Las imágenes se guardan en products/[productId]/ para mejor organización
 */
export async function migrateImageToS3(
  imageUrl: string,
  productId: string
): Promise<string> {
  try {
    // Si ya es una URL de S3, no hacer nada
    if (isS3Url(imageUrl)) {
      return imageUrl;
    }

    // Descargar la imagen
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Validar tipo de contenido
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      throw new Error(`Tipo de archivo no permitido: ${contentType}`);
    }

    // Generar nombre único
    const extension = contentType.includes("png") ? "png" : "jpg";
    const fileName = generateUniqueFileName(productId, `image.${extension}`);
    // Guardar en products/[productId]/ para mejor organización
    const key = `products/${productId}/${fileName}`;

    // Subir a S3
    return await uploadToS3(buffer, key, contentType);
  } catch (error: any) {
    console.error(`Error migrating image ${imageUrl}:`, error);
    throw error;
  }
}

