# Solución de Problemas de Conexión con Supabase Pooler

## Problema Identificado

El pooler de Supabase (Supavisor) usa el **puerto 6543**, no el puerto 5432. El puerto 5432 es para conexiones directas.

## Configuración Correcta

### 1. DATABASE_URL (Pooler - Producción)

Para producción (Vercel), usa el pooler con puerto 6543:

```
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&connect_timeout=30&pool_timeout=30&sslmode=require"
```

**Nota:** El código ahora automáticamente:
- Cambia el puerto 5432 a 6543 si detecta pooler
- Agrega `pgbouncer=true`
- Limita conexiones a 1 por instancia
- Agrega timeouts apropiados

### 2. DIRECT_URL (Opcional - Para Migraciones)

Para migraciones de Prisma, puedes usar una conexión directa:

```
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"
```

**Nota:** Esta variable es opcional. Si no está configurada, Prisma usará DATABASE_URL para todo.

### 3. Configuración en Vercel

En Vercel, configura ambas variables de entorno:

1. **DATABASE_URL**: URL del pooler (puerto 6543)
2. **DIRECT_URL** (opcional): URL directa para migraciones

## Verificación

Después de actualizar la configuración:

1. **Regenerar Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Probar conexión:**
   ```bash
   npx tsx scripts/test-db-connection.ts
   ```

3. **Desplegar en Vercel** y verificar que funciona

## Cambios Realizados

1. ✅ **Puerto automático**: El código ahora cambia 5432 → 6543 para pooler
2. ✅ **Timeouts mejorados**: `connect_timeout=30` y `pool_timeout=30`
3. ✅ **Límite de conexiones**: `connection_limit=1` para evitar saturación
4. ✅ **Direct URL opcional**: Schema.prisma ahora soporta DIRECT_URL para migraciones

## Si el Problema Persiste

1. **Verifica el puerto en tu DATABASE_URL**: Debe ser 6543 para pooler
2. **Usa conexión directa temporalmente**: Cambia a `db.xxxxx.supabase.co:5432` para probar
3. **Verifica las restricciones de red**: En Supabase Dashboard → Settings → Database → Network Restrictions
4. **Revisa el plan de Supabase**: El plan gratuito tiene límites de conexiones

