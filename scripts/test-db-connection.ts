import { PrismaClient } from "@prisma/client";
import { resolvePrismaDatabaseUrl } from "../lib/prisma-url";

async function testConnection() {
  console.log("🔍 Probando conexión a la base de datos...\n");

  const rawDbUrl = process.env.DATABASE_URL;
  if (!rawDbUrl) {
    console.error("❌ DATABASE_URL no está configurada en .env");
    process.exit(1);
  }

  // Usar la misma función que usa la aplicación para resolver la URL
  // Esto aplica automáticamente las correcciones (puerto, parámetros, etc.)
  const dbUrl = resolvePrismaDatabaseUrl(rawDbUrl);

  // Mostrar URL original y corregida
  const rawUrlObj = new URL(rawDbUrl);
  const urlObj = new URL(dbUrl);

  console.log(
    `📡 URL Original: ${rawUrlObj.protocol}//${rawUrlObj.username}@${rawUrlObj.hostname}:${rawUrlObj.port}${rawUrlObj.pathname}`
  );
  console.log(
    `📡 URL Corregida: ${urlObj.protocol}//${urlObj.username}@${urlObj.hostname}:${urlObj.port}${urlObj.pathname}`
  );
  console.log(`🏠 Host: ${urlObj.hostname}`);
  console.log(
    `🔌 Puerto: ${urlObj.port}${
      rawUrlObj.port !== urlObj.port ? ` (corregido de ${rawUrlObj.port})` : ""
    }`
  );
  console.log(`📊 Base de datos: ${urlObj.pathname.replace("/", "")}`);

  // Mostrar parámetros importantes
  const params = urlObj.searchParams;
  if (params.has("pgbouncer")) {
    console.log(`✅ pgbouncer: ${params.get("pgbouncer")}`);
  }
  if (params.has("connection_limit")) {
    console.log(`✅ connection_limit: ${params.get("connection_limit")}`);
  }
  if (params.has("connect_timeout")) {
    console.log(`✅ connect_timeout: ${params.get("connect_timeout")}`);
  }
  if (params.has("pool_timeout")) {
    console.log(`✅ pool_timeout: ${params.get("pool_timeout")}`);
  }
  console.log();

  const prisma = new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: dbUrl, // Usar la URL corregida
      },
    },
  });

  try {
    console.log("🔄 Intentando conectar...");
    await prisma.$connect();
    console.log("✅ Conexión exitosa!\n");

    console.log("📦 Verificando productos...");
    const productCount = await prisma.product.count();
    console.log(`   Total de productos: ${productCount}\n`);

    if (productCount > 0) {
      console.log("📋 Primeros productos:");
      const products = await prisma.product.findMany({
        take: 3,
        select: {
          id: true,
          name: true,
          price: true,
        },
      });
      products.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} - $${Number(p.price).toFixed(2)}`);
      });
    } else {
      console.log("⚠️  No hay productos en la base de datos");
    }

    console.log("\n✅ Prueba completada exitosamente!");
  } catch (error: any) {
    console.error("\n❌ Error al conectar:", error.message);
    if (error.message.includes("Can't reach database")) {
      console.error("\n💡 Posibles soluciones:");
      console.error("   1. Verifica que Supabase esté activo");
      console.error(
        "   2. Intenta usar la conexión DIRECTA en lugar del pooler"
      );
      console.error(
        "      En Supabase: Settings → Database → Connection String"
      );
      console.error("      Cambia 'Session pooler' a 'Direct Connection'");
      console.error("   3. Verifica tu conexión a internet");
      console.error("   4. Verifica que tu IP esté permitida en Supabase");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
