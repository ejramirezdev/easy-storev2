/**
 * Configuración centralizada de la aplicación
 * Todos los valores configurables deben estar en variables de entorno
 * con valores por defecto razonables para desarrollo
 */

// ==================== INFORMACIÓN DE LA EMPRESA ====================
export const COMPANY_CONFIG = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || "Easy Store",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "easystoreecu@gmail.com",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "+593958720950",
  whatsapp: process.env.NEXT_PUBLIC_COMPANY_WHATSAPP || "+593958720950",
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "Ecuador",
  
  // Redes sociales
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/easystoreecu/",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
  twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "",
} as const;

// ==================== URLS Y DOMINIOS ====================
export const SITE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com",
  domain: process.env.NEXT_PUBLIC_DOMAIN || "easystoreecu.com",
} as const;

// ==================== LÍMITES Y PAGINACIÓN ====================
export const PAGINATION_CONFIG = {
  // Productos por página en listados
  productsPerPage: parseInt(process.env.NEXT_PUBLIC_PRODUCTS_PER_PAGE || "12", 10),
  
  // Productos destacados en página principal
  featuredProductsLimit: parseInt(process.env.NEXT_PUBLIC_FEATURED_PRODUCTS_LIMIT || "6", 10),
  
  // Productos relacionados
  relatedProductsLimit: parseInt(process.env.NEXT_PUBLIC_RELATED_PRODUCTS_LIMIT || "10", 10),
  
  // Órdenes por página
  ordersPerPage: parseInt(process.env.NEXT_PUBLIC_ORDERS_PER_PAGE || "10", 10),
  
  // Límite de usuarios en admin
  usersLimit: parseInt(process.env.ADMIN_USERS_LIMIT || "100", 10),
} as const;

// ==================== TIMEOUTS Y LÍMITES DE CONEXIÓN ====================
export const CONNECTION_CONFIG = {
  // Database
  dbConnectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "1", 10),
  dbConnectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "30", 10),
  dbPoolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || "30", 10),
  
  // API timeouts (en milisegundos)
  apiTimeout: parseInt(process.env.API_TIMEOUT || "30000", 10),
  
  // Payphone confirmation timeout (en minutos)
  payphoneConfirmationTimeout: parseInt(process.env.PAYPHONE_CONFIRMATION_TIMEOUT || "5", 10),
} as const;

// ==================== ADMIN CONFIGURATION ====================
export const ADMIN_CONFIG = {
  // Email del propietario principal (OWNER)
  ownerEmail: process.env.ADMIN_OWNER_EMAIL || "ejramirezdev@gmail.com",
  
  // Emails de administradores por defecto (legacy, se recomienda usar la base de datos)
  // Esta lista ya no se usa para autenticación, solo como referencia
  defaultAdminEmails: (process.env.ADMIN_DEFAULT_EMAILS || "ejramirezdev@gmail.com")
    .split(",")
    .map(e => e.trim()),
} as const;

// ==================== AWS S3 CONFIGURATION ====================
export const AWS_CONFIG = {
  region: process.env.AWS_REGION || "us-east-1",
  bucket: process.env.AWS_S3_BUCKET || "",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
} as const;

// ==================== EMAIL CONFIGURATION ====================
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || COMPANY_CONFIG.email,
  replyTo: process.env.EMAIL_REPLY_TO || COMPANY_CONFIG.email,
  
  // Para notificaciones de órdenes, contacto, etc.
  notificationsTo: process.env.EMAIL_NOTIFICATIONS_TO || COMPANY_CONFIG.email,
} as const;

// ==================== SEO Y METADATA ====================
export const SEO_CONFIG = {
  defaultTitle: process.env.NEXT_PUBLIC_SEO_DEFAULT_TITLE || "Easy Store - Productos Tecnológicos en Ecuador",
  defaultDescription: process.env.NEXT_PUBLIC_SEO_DEFAULT_DESCRIPTION || 
    "Tienda de productos tecnológicos, gadgets y servicios en Ecuador. Encuentra dispositivos electrónicos, reparación de laptops y desarrollo de software.",
  keywords: [
    "productos tecnológicos Ecuador",
    "gadgets Ecuador",
    "dispositivos electrónicos Ecuador",
    "reparación laptops Ecuador",
    "desarrollo software Ecuador",
    "tienda tecnología Ecuador",
  ],
} as const;

// ==================== VALIDACIÓN DE CONFIGURACIÓN ====================
/**
 * Valida que las variables de entorno críticas estén configuradas
 * Lanza un error si falta alguna variable requerida en producción
 */
export function validateConfig() {
  const errors: string[] = [];
  
  if (process.env.NODE_ENV === "production") {
    // Variables críticas en producción
    if (!process.env.DATABASE_URL) {
      errors.push("DATABASE_URL no está configurada");
    }
    
    if (!process.env.NEXTAUTH_SECRET) {
      errors.push("NEXTAUTH_SECRET no está configurada");
    }
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      errors.push("Credenciales de Google OAuth no están configuradas");
    }
    
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      console.warn("⚠️  NEXT_PUBLIC_SITE_URL no está configurada, usando valor por defecto");
    }
  }
  
  if (errors.length > 0) {
    throw new Error(
      `❌ Variables de entorno faltantes:\n${errors.map(e => `  - ${e}`).join("\n")}`
    );
  }
}

// ==================== HELPERS ====================
/**
 * Verifica si el email es el propietario principal
 */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_CONFIG.ownerEmail.toLowerCase();
}

/**
 * Obtiene la URL completa del sitio con path
 */
export function getSiteUrl(path: string = ""): string {
  const baseUrl = SITE_CONFIG.url;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return path ? `${baseUrl}${cleanPath}` : baseUrl;
}

/**
 * Formatea un número de teléfono para WhatsApp
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remover caracteres no numéricos excepto el +
  let cleaned = phone.replace(/[^\d+]/g, "");
  
  // Si no tiene +, y empieza con 593, agregar +
  if (!cleaned.startsWith("+") && cleaned.startsWith("593")) {
    cleaned = `+${cleaned}`;
  }
  
  // Si es número local (9 o 10 dígitos), agregar código de país Ecuador
  if (!cleaned.startsWith("+") && cleaned.length >= 9 && cleaned.length <= 10) {
    cleaned = `+593${cleaned}`;
  }
  
  return cleaned;
}

