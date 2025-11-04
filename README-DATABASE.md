# Configuración de Base de Datos

## Problema Común: No se pueden conectar productos en desarrollo local

Si no puedes ver productos en desarrollo local, es probable que el **pooler de Supabase** no sea accesible desde tu red.

## Solución: Usar Conexión Directa en Desarrollo Local

### Pasos:

1. **Ve a Supabase Dashboard:**
   - Settings → Database → Connection String

2. **Cambia el método de conexión:**
   - Cambia "Method" de **"Session pooler"** a **"Direct Connection"**

3. **Copia la nueva URL:**
   - La URL debería verse así:
     ```
     postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres
     ```
   - Nota: Debe tener `db.xxxxx.supabase.co` (NO `pooler.supabase.com`)

4. **Actualiza tu archivo `.env`:**
   ```env
   DATABASE_URL=postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require
   ```

5. **Reinicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

## Configuración Recomendada

- **Desarrollo Local:** Usa "Direct Connection" (más confiable)
- **Producción (Vercel):** Usa "Session pooler" (mejor para escalar)

## Probar la Conexión

Ejecuta el script de prueba:
```bash
npx tsx scripts/test-db-connection.ts
```

Este script verificará:
- ✅ Si la conexión funciona
- ✅ Cuántos productos hay en la base de datos
- ✅ Muestra los primeros productos

## Troubleshooting

### Error: "Can't reach database server"

**Solución 1:** Usa conexión directa en lugar del pooler

**Solución 2:** Verifica que:
- Supabase esté activo
- Tu conexión a internet funcione
- Tu IP esté permitida en Supabase (Settings → Database → Network Restrictions)

**Solución 3:** Verifica que la contraseña en `.env` sea correcta

### Error: "SSL connection required"

Asegúrate de que la URL tenga `?sslmode=require` al final

### No hay productos

Si la conexión funciona pero no hay productos, ejecuta el seed:
```bash
npm run seed
```

