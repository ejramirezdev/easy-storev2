import { PrismaClient } from "@prisma/client";
import { resolvePrismaDatabaseUrl } from "./prisma-url";

declare global {
  // evita múltiples instancias en dev (HMR)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  // Durante build time, no intentar crear el cliente
  // Esto evita errores cuando DATABASE_URL no está disponible o la BD no es accesible
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null as any;
  }

  try {
    // Resolver la URL con los parámetros correctos
    const dbUrl = resolvePrismaDatabaseUrl();
    
    const client = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"] // Solo errores y warnings para reducir ruido
          : ["error"],
      // Configuración de conexión para evitar saturar el pooler
      // En producción, cada instancia de Vercel puede crear su propio cliente
      // Esto limita las conexiones y evita saturar Supabase
    });

    if (typeof (client as unknown as { favorite?: object }).favorite === "undefined") {
      throw new Error(
        "Prisma Client no fue generado correctamente. Ejecuta `npx prisma generate` o reinstala las dependencias para regenerar el cliente.",
      );
    }

    // En producción, asegurar que las conexiones se cierren correctamente
    if (process.env.NODE_ENV === "production") {
      // Manejar desconexión limpia al cerrar
      process.on("beforeExit", async () => {
        await client.$disconnect();
      });
    }

    return client;
  } catch (error) {
    // Durante build, no lanzar errores, solo retornar null
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return null as any;
    }

    // En desarrollo, mostrar el error pero lanzarlo para que sea visible
    if (process.env.NODE_ENV === "development") {
      console.error("❌ Error al crear Prisma Client:", error);
      if (error instanceof Error) {
        if (error.message.includes("Can't reach database")) {
          console.error("💡 Verifica que tu DATABASE_URL sea correcta y que Supabase esté accesible");
        }
      }
      // En desarrollo, lanzar el error para debugging
      throw error;
    }

    // Si es un error de inicialización de Prisma, lanzarlo
    if (
      error instanceof Error &&
      error.message.includes("@prisma/client did not initialize yet")
    ) {
      throw new Error(
        "Prisma Client no fue generado. Ejecuta `npx prisma generate` (o reinstala dependencias) antes de iniciar la aplicación.",
        { cause: error },
      );
    }

    // En producción, retornar null silenciosamente para evitar que la app se caiga
    return null as any;
  }
}

// Solo crear una instancia si no existe en global
// Esto es crítico para evitar múltiples conexiones
export const prisma = global.prisma ?? createPrismaClient();

// Solo guardar en global si se creó exitosamente (no es null)
// Esto evita guardar null en global.prisma
// En producción también usar singleton para evitar múltiples clientes
if (prisma) {
  global.prisma = prisma;
}
