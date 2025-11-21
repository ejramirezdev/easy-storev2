/**
 * Validación avanzada de archivos usando magic bytes
 */

// Magic bytes para diferentes tipos de imagen
const IMAGE_SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  "image/webp": [
    [0x52, 0x49, 0x46, 0x46], // RIFF
  ],
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Valida el tipo de archivo usando magic bytes (más seguro que confiar en MIME type)
 */
async function validateFileSignature(
  file: File,
  expectedType: string
): Promise<boolean> {
  const signatures = IMAGE_SIGNATURES[expectedType];
  if (!signatures) return false;

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  return signatures.some((signature) => {
    if (bytes.length < signature.length) return false;
    return signature.every((byte, index) => bytes[index] === byte);
  });
}

/**
 * Valida un archivo de imagen de forma exhaustiva
 */
export async function validateImageFileAdvanced(
  file: File
): Promise<{ valid: boolean; error?: string }> {
  // 1. Validar que el archivo exista
  if (!file) {
    return { valid: false, error: "No se proporcionó archivo" };
  }

  // 2. Validar tamaño
  if (file.size === 0) {
    return { valid: false, error: "El archivo está vacío" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo debe ser menor a ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // 3. Validar tipo MIME
  const mimeType = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: "Solo se permiten imágenes en formato JPG, JPEG o PNG",
    };
  }

  // 4. Validar extensión del nombre de archivo
  const fileName = file.name.toLowerCase();
  const extension = fileName.split(".").pop();
  const allowedExtensions = ["jpg", "jpeg", "png"];
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: "La extensión del archivo no es válida",
    };
  }

  // 5. Validar magic bytes (más seguro)
  const expectedType = mimeType === "image/jpg" ? "image/jpeg" : mimeType;
  const isValidSignature = await validateFileSignature(file, expectedType);
  if (!isValidSignature) {
    return {
      valid: false,
      error: "El contenido del archivo no coincide con su tipo declarado",
    };
  }

  // 6. Validar nombre de archivo (prevenir path traversal)
  if (
    fileName.includes("..") ||
    fileName.includes("/") ||
    fileName.includes("\\")
  ) {
    return {
      valid: false,
      error: "El nombre del archivo contiene caracteres no permitidos",
    };
  }

  return { valid: true };
}

/**
 * Genera un nombre de archivo seguro
 */
export function generateSafeFileName(
  prefix: string,
  originalName: string
): string {
  // Remover caracteres peligrosos
  const sanitized = originalName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/\.\./g, "_")
    .substring(0, 100); // Limitar longitud

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = sanitized.split(".").pop()?.toLowerCase() || "jpg";

  // Validar extensión
  const allowedExtensions = ["jpg", "jpeg", "png"];
  const safeExtension = allowedExtensions.includes(extension)
    ? extension
    : "jpg";

  return `${prefix}-${timestamp}-${random}.${safeExtension}`;
}
