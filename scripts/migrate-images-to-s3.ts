#!/usr/bin/env tsx

/**
 * Script para migrar imágenes de productos existentes a S3
 * 
 * Este script:
 * 1. Obtiene todos los productos con imageUrl
 * 2. Obtiene todas las ProductImage con url
 * 3. Para cada URL externa (no de S3):
 *    - Descarga la imagen
 *    - Valida que sea jpg o png
 *    - Sube a S3
 *    - Actualiza el registro en la base de datos
 * 
 * Uso:
 *   npx tsx scripts/migrate-images-to-s3.ts
 *   
 * Opciones:
 *   --dry-run    Simula la migración sin hacer cambios
 *   --product=ID  Migra solo un producto específico
 */

import { PrismaClient } from "@prisma/client";
import { migrateImageToS3, isS3Url } from "../lib/s3";

const prisma = new PrismaClient();

// Argumentos de línea de comandos
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const specificProduct = args.find((arg) => arg.startsWith("--product="))?.split("=")[1];

interface MigrationStats {
  totalProducts: number;
  productsWithImages: number;
  totalImages: number;
  imagesAlreadyInS3: number;
  imagesMigrated: number;
  imagesFailed: number;
  errors: Array<{ url: string; error: string }>;
}

const stats: MigrationStats = {
  totalProducts: 0,
  productsWithImages: 0,
  totalImages: 0,
  imagesAlreadyInS3: 0,
  imagesMigrated: 0,
  imagesFailed: 0,
  errors: [],
};

function log(message: string, type: "info" | "success" | "warning" | "error" = "info") {
  const prefix = {
    info: "ℹ️ ",
    success: "✅",
    warning: "⚠️ ",
    error: "❌",
  }[type];

  console.log(`${prefix} ${message}`);
}

async function migrateProductImage(productId: string, currentUrl: string): Promise<string | null> {
  // Si ya es S3, no hacer nada
  if (isS3Url(currentUrl)) {
    stats.imagesAlreadyInS3++;
    log(`Imagen ya está en S3: ${currentUrl}`, "info");
    return currentUrl;
  }

  try {
    log(`Migrando imagen principal: ${currentUrl}...`, "info");
    
    if (dryRun) {
      log(`[DRY RUN] Simulando migración de: ${currentUrl}`, "warning");
      stats.imagesMigrated++;
      return currentUrl; // En dry run, no cambiar la URL
    }

    const newUrl = await migrateImageToS3(currentUrl, productId);
    stats.imagesMigrated++;
    log(`Imagen migrada exitosamente a: ${newUrl}`, "success");
    return newUrl;
  } catch (error: any) {
    stats.imagesFailed++;
    stats.errors.push({ url: currentUrl, error: error.message });
    log(`Error migrando imagen: ${error.message}`, "error");
    return null;
  }
}

async function migrateGalleryImage(
  imageId: string,
  productId: string,
  currentUrl: string
): Promise<string | null> {
  // Si ya es S3, no hacer nada
  if (isS3Url(currentUrl)) {
    stats.imagesAlreadyInS3++;
    log(`Imagen de galería ya está en S3: ${currentUrl}`, "info");
    return currentUrl;
  }

  try {
    log(`Migrando imagen de galería: ${currentUrl}...`, "info");
    
    if (dryRun) {
      log(`[DRY RUN] Simulando migración de: ${currentUrl}`, "warning");
      stats.imagesMigrated++;
      return currentUrl; // En dry run, no cambiar la URL
    }

    const newUrl = await migrateImageToS3(currentUrl, productId);
    stats.imagesMigrated++;
    log(`Imagen de galería migrada a: ${newUrl}`, "success");
    return newUrl;
  } catch (error: any) {
    stats.imagesFailed++;
    stats.errors.push({ url: currentUrl, error: error.message });
    log(`Error migrando imagen de galería: ${error.message}`, "error");
    return null;
  }
}

async function migrateProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: true,
    },
  });

  if (!product) {
    log(`Producto ${productId} no encontrado`, "error");
    return;
  }

  log(`\n📦 Procesando producto: ${product.name} (ID: ${product.id})`, "info");

  let hasChanges = false;

  // Migrar imagen principal
  if (product.imageUrl) {
    stats.totalImages++;
    const newUrl = await migrateProductImage(product.id, product.imageUrl);

    if (newUrl && newUrl !== product.imageUrl && !dryRun) {
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: newUrl },
      });
      hasChanges = true;
      log(`Base de datos actualizada con nueva URL principal`, "success");
    }
  }

  // Migrar imágenes de galería
  for (const image of product.images) {
    stats.totalImages++;
    const newUrl = await migrateGalleryImage(image.id, product.id, image.url);

    if (newUrl && newUrl !== image.url && !dryRun) {
      await prisma.productImage.update({
        where: { id: image.id },
        data: { url: newUrl },
      });
      hasChanges = true;
      log(`Base de datos actualizada con nueva URL de galería`, "success");
    }
  }

  if (hasChanges) {
    stats.productsWithImages++;
  }
}

async function main() {
  log("\n🚀 Iniciando migración de imágenes a S3\n", "info");

  if (dryRun) {
    log("⚠️  MODO DRY RUN - No se harán cambios reales\n", "warning");
  }

  // Verificar configuración de AWS
  if (!process.env.AWS_S3_BUCKET_NAME) {
    log("Error: AWS_S3_BUCKET_NAME no está configurado en las variables de entorno", "error");
    process.exit(1);
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    log("Error: Credenciales de AWS no configuradas", "error");
    process.exit(1);
  }

  try {
    // Si se especificó un producto, migrar solo ese
    if (specificProduct) {
      log(`Migrando solo el producto: ${specificProduct}\n`, "info");
      stats.totalProducts = 1;
      await migrateProduct(specificProduct);
    } else {
      // Obtener todos los productos
      const products = await prisma.product.findMany({
        select: { id: true },
      });

      stats.totalProducts = products.length;
      log(`Encontrados ${products.length} productos para revisar\n`, "info");

      // Procesar cada producto
      for (const product of products) {
        await migrateProduct(product.id);
      }
    }

    // Mostrar resumen
    log("\n" + "=".repeat(60), "info");
    log("📊 RESUMEN DE MIGRACIÓN", "info");
    log("=".repeat(60), "info");
    log(`Total de productos revisados: ${stats.totalProducts}`, "info");
    log(`Productos con cambios: ${stats.productsWithImages}`, "info");
    log(`Total de imágenes procesadas: ${stats.totalImages}`, "info");
    log(`Imágenes ya en S3: ${stats.imagesAlreadyInS3}`, "info");
    log(`Imágenes migradas exitosamente: ${stats.imagesMigrated}`, "success");
    log(`Imágenes con errores: ${stats.imagesFailed}`, stats.imagesFailed > 0 ? "error" : "info");

    if (stats.errors.length > 0) {
      log("\n❌ Errores encontrados:", "error");
      stats.errors.forEach((err, index) => {
        log(`  ${index + 1}. URL: ${err.url}`, "error");
        log(`     Error: ${err.error}`, "error");
      });
    }

    if (dryRun) {
      log("\n⚠️  Esto fue una simulación. Ejecuta sin --dry-run para aplicar cambios.", "warning");
    } else if (stats.imagesMigrated > 0) {
      log("\n✅ Migración completada exitosamente!", "success");
    }

    log("=".repeat(60) + "\n", "info");
  } catch (error: any) {
    log(`Error fatal durante la migración: ${error.message}`, "error");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
main().catch((error) => {
  console.error("Error ejecutando script:", error);
  process.exit(1);
});

