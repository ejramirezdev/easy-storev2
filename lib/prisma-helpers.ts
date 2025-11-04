/**
 * Helper functions para manejar errores de conexión de Prisma
 * con reintentos automáticos
 */

type RetryOptions = {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
};

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delay: 1000,
  backoff: true,
};

/**
 * Ejecuta una función con reintentos automáticos en caso de error de conexión
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Si no es un error de conexión, no reintentar
      if (
        !error?.message?.includes("Can't reach database") &&
        !error?.message?.includes("connection") &&
        !error?.code?.includes("P1001") && // Prisma error code for connection
        !error?.code?.includes("P1017") // Prisma error code for connection closed
      ) {
        throw error;
      }

      // Si es el último intento, lanzar el error
      if (attempt === opts.maxRetries) {
        break;
      }

      // Calcular delay con backoff exponencial si está habilitado
      const delay = opts.backoff
        ? opts.delay * Math.pow(2, attempt)
        : opts.delay;

      // Esperar antes del siguiente intento
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Si llegamos aquí, todos los reintentos fallaron
  throw lastError || new Error("Unknown error in withRetry");
}

/**
 * Verifica si un error es de conexión
 */
export function isConnectionError(error: any): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() || "";
  const code = error.code || "";

  return (
    message.includes("can't reach database") ||
    message.includes("connection") ||
    code.includes("P1001") ||
    code.includes("P1017")
  );
}

