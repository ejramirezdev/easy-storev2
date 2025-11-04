export function resolvePrismaDatabaseUrl(rawUrl = process.env.DATABASE_URL) {
  // Durante build time, retornar una URL dummy para evitar errores
  // Esta URL no se usará realmente porque el cliente Prisma será null
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return "postgresql://dummy:dummy@localhost:5432/dummy";
  }

  if (!rawUrl) {
    throw new Error(
      "DATABASE_URL no está configurada. Asegúrate de definir la variable de entorno antes de iniciar Prisma.",
    );
  }

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    // Para Supabase pooler, asegurar parámetros correctos
    if (host.includes("pooler.supabase.com")) {
      // En desarrollo, recomendar usar conexión directa
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️  Usando pooler de Supabase. Si tienes problemas de conexión, considera usar 'Direct Connection' en desarrollo local.");
      }

      if (!url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
      }

      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "1");
      }

      // Asegurar SSL mode
      if (!url.searchParams.has("sslmode")) {
        url.searchParams.set("sslmode", "require");
      }
    }

    // Para conexión directa de Supabase (db.xxxxx.supabase.co)
    if (host.includes(".supabase.co") && !host.includes("pooler")) {
      // Conexión directa - no necesita pgbouncer
      if (url.searchParams.has("pgbouncer")) {
        url.searchParams.delete("pgbouncer");
      }

      // Asegurar SSL mode
      if (!url.searchParams.has("sslmode")) {
        url.searchParams.set("sslmode", "require");
      }
    }

    return url.toString();
  } catch (error) {
    throw new Error(
      "DATABASE_URL es inválida o no es una URL de conexión de Postgres reconocida. Revisa su formato.",
      { cause: error instanceof Error ? error : undefined },
    );
  }
}
