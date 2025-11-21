/**
 * Límites de tamaño para requests
 */

export const REQUEST_LIMITS = {
  // Límite máximo de tamaño del body JSON (10MB)
  MAX_JSON_BODY_SIZE: 10 * 1024 * 1024,
  
  // Límite máximo de tamaño de FormData (50MB para archivos)
  MAX_FORM_DATA_SIZE: 50 * 1024 * 1024,
  
  // Límite máximo de campos en FormData
  MAX_FORM_FIELDS: 100,
  
  // Límite máximo de longitud de string individual
  MAX_STRING_LENGTH: 10000,
} as const;

/**
 * Valida el tamaño del body de la request
 */
export async function validateRequestBodySize(
  req: Request,
  maxSize: number = REQUEST_LIMITS.MAX_JSON_BODY_SIZE
): Promise<{ valid: boolean; error?: string }> {
  const contentLength = req.headers.get("content-length");
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSize) {
      return {
        valid: false,
        error: `El tamaño de la solicitud excede el límite de ${maxSize / (1024 * 1024)}MB`,
      };
    }
  }
  
  return { valid: true };
}

