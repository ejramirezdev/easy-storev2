export function resolvePrismaDatabaseUrl(rawUrl = process.env.DATABASE_URL) {
  if (!rawUrl) {
    throw new Error(
      "DATABASE_URL no está configurada. Asegúrate de definir la variable de entorno antes de iniciar Prisma.",
    );
  }

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    if (host.includes("pooler.supabase.com")) {
      if (!url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
      }

      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "1");
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
