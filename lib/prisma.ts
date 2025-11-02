import { PrismaClient } from "@prisma/client";

declare global {
  // evita múltiples instancias en dev (HMR)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  try {
    const client = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });

    if (typeof (client as unknown as { favorite?: object }).favorite === "undefined") {
      throw new Error(
        "Prisma Client no fue generado correctamente. Ejecuta `npx prisma generate` o reinstala las dependencias para regenerar el cliente.",
      );
    }

    return client;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("@prisma/client did not initialize yet")
    ) {
      throw new Error(
        "Prisma Client no fue generado. Ejecuta `npx prisma generate` (o reinstala dependencias) antes de iniciar la aplicación.",
        { cause: error },
      );
    }

    throw error;
  }
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
