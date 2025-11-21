/**
 * Utilidades para sanitizar datos y prevenir XSS
 */

/**
 * Escapa caracteres HTML especiales para prevenir XSS
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitiza un string para uso en atributos HTML
 */
export function escapeHtmlAttribute(value: string | null | undefined): string {
  return escapeHtml(value).replace(/\n/g, "&#10;").replace(/\r/g, "&#13;");
}

/**
 * Sanitiza contenido HTML permitiendo solo tags seguros
 * Para contenido rico, considera usar una librería como DOMPurify
 */
export function sanitizeHtml(html: string): string {
  // Por ahora, solo escapamos todo. Para contenido rico, usar DOMPurify
  return escapeHtml(html);
}

/**
 * Valida y sanitiza una URL
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    // Solo permitir HTTPS en producción
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      return null;
    }
    // Permitir http solo en desarrollo
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Valida y sanitiza un email
 */
export function sanitizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  
  // Limitar longitud
  if (trimmed.length > 254) {
    return null;
  }
  
  return trimmed;
}

/**
 * Sanitiza texto para uso en emails HTML
 */
export function sanitizeForEmail(text: string): string {
  return escapeHtml(text)
    .replace(/\n/g, "<br>")
    .replace(/\r/g, "");
}

