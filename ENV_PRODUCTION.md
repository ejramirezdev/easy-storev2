# Variables de Entorno para Producción - Easy Store

## 📋 INSTRUCCIONES

1. **Copia todo el contenido de abajo**
2. **Ve a tu proyecto en Vercel**
3. **Settings > Environment Variables**
4. **Pega cada variable y completa con tus valores reales**
5. **Asegúrate de seleccionar "Production" en el selector de entorno**

---

## 🔴 VARIABLES CRÍTICAS (OBLIGATORIAS)

```env
# ============================================
# ENTORNO
# ============================================
NODE_ENV=production

# ============================================
# BASE DE DATOS (Prisma/PostgreSQL)
# ============================================
# IMPORTANTE: Usa la conexión del pooler de Supabase para producción
# Formato: postgresql://postgres.[project]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&connect_timeout=30
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&connect_timeout=30

# ============================================
# NEXT.JS Y NEXT AUTH
# ============================================
# URL base de tu aplicación (DEBE coincidir exactamente con tu dominio en Vercel)
NEXT_PUBLIC_SITE_URL=https://easy-storev2.vercel.app
NEXT_PUBLIC_BASE_URL=https://easy-storev2.vercel.app

# Secret para NextAuth (genera uno nuevo: openssl rand -base64 32)
# IMPORTANTE: Este debe ser diferente al de desarrollo
NEXTAUTH_SECRET=[GENERA-UN-SECRETO-ALEATORIO-MUY-LARGO-MINIMO-32-CARACTERES]

# URL donde está desplegada tu aplicación (para NextAuth)
# IMPORTANTE: Debe coincidir exactamente con tu dominio (sin barra final)
NEXTAUTH_URL=https://easy-storev2.vercel.app

# ============================================
# GOOGLE OAUTH
# ============================================
# Obtén estas credenciales de: https://console.cloud.google.com/apis/credentials
# IMPORTANTE: Configura en Google Cloud Console:
# - Orígenes autorizados: https://easy-storev2.vercel.app
# - Redirect URIs: https://easy-storev2.vercel.app/api/auth/callback/google
GOOGLE_CLIENT_ID=[TU-GOOGLE-CLIENT-ID].apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[TU-GOOGLE-CLIENT-SECRET]
```

---

## 🟡 VARIABLES IMPORTANTES (RECOMENDADAS)

```env
# ============================================
# AWS S3 (Almacenamiento de imágenes)
# ============================================
AWS_ACCESS_KEY_ID=[TU-AWS-ACCESS-KEY-ID]
AWS_SECRET_ACCESS_KEY=[TU-AWS-SECRET-ACCESS-KEY]
AWS_REGION=us-east-2
AWS_S3_BUCKET_NAME=[TU-BUCKET-NAME]
AWS_S3_BUCKET_URL=https://[TU-BUCKET-NAME].s3.us-east-2.amazonaws.com

# ============================================
# SMTP (Envío de emails)
# ============================================
# Para Gmail, usa una contraseña de aplicación (NO tu contraseña normal)
# Cómo obtener: Google Account > Seguridad > Verificación en 2 pasos > Contraseñas de aplicaciones
SMTP_USER=easystoreecu@gmail.com
SMTP_PASS=[TU-CONTRASEÑA-DE-APLICACIÓN-GMAIL-16-CARACTERES]
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=easystoreecu@gmail.com

# Variables alternativas (compatibilidad)
EMAIL_USER=easystoreecu@gmail.com
EMAIL_PASSWORD=[TU-CONTRASEÑA-DE-APLICACIÓN-GMAIL-16-CARACTERES]
```

---

## 🟢 VARIABLES OPCIONALES (PAYPHONE - Pagos)

```env
# ============================================
# PAYPHONE (Procesamiento de pagos)
# ============================================
# IMPORTANTE: Las configuraciones de Payphone también se pueden guardar en la base de datos
# desde el panel admin. Estas variables de entorno se usan como fallback.

# Entorno: sandbox (pruebas) o production (producción)
PAYPHONE_ENVIRONMENT=sandbox

# Token de autenticación de Payphone (Bearer Token)
# Obtén esto de tu cuenta de Payphone Developer
PAYPHONE_TOKEN=[TU-PAYPHONE-TOKEN]

# Store ID / Id Cliente de Payphone
PAYPHONE_STORE_ID=[TU-PAYPHONE-STORE-ID]

# URL de respuesta después del pago
PAYPHONE_RESPONSE_URL=https://easy-storev2.vercel.app/api/payphone/callback

# Información del comerciante
PAYPHONE_MERCHANT_NAME=Easy Store
PAYPHONE_MERCHANT_EMAIL=easystoreecu@gmail.com

# Moneda para los pagos
PAYPHONE_CURRENCY=USD

# Secret para confirmación de pagos pendientes (opcional, para cron jobs)
# Genera uno aleatorio: openssl rand -base64 32
PAYPHONE_CONFIRM_SECRET=[SECRET-ALEATORIO-PARA-CONFIRMACION-PAGOS-PENDIENTES]
```

---

## 📝 LISTA COMPLETA PARA COPIAR Y PEGAR EN VERCEL

Copia y pega cada una de estas líneas en Vercel, reemplazando los valores entre corchetes `[ ]`:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&connect_timeout=30
NEXT_PUBLIC_SITE_URL=https://easy-storev2.vercel.app
NEXT_PUBLIC_BASE_URL=https://easy-storev2.vercel.app
NEXTAUTH_SECRET=[GENERA-UN-SECRETO-ALEATORIO-MUY-LARGO-MINIMO-32-CARACTERES]
NEXTAUTH_URL=https://easy-storev2.vercel.app
GOOGLE_CLIENT_ID=[TU-GOOGLE-CLIENT-ID].apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[TU-GOOGLE-CLIENT-SECRET]
AWS_ACCESS_KEY_ID=[TU-AWS-ACCESS-KEY-ID]
AWS_SECRET_ACCESS_KEY=[TU-AWS-SECRET-ACCESS-KEY]
AWS_REGION=us-east-2
AWS_S3_BUCKET_NAME=[TU-BUCKET-NAME]
AWS_S3_BUCKET_URL=https://[TU-BUCKET-NAME].s3.us-east-2.amazonaws.com
SMTP_USER=easystoreecu@gmail.com
SMTP_PASS=[TU-CONTRASEÑA-DE-APLICACIÓN-GMAIL-16-CARACTERES]
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=easystoreecu@gmail.com
EMAIL_USER=easystoreecu@gmail.com
EMAIL_PASSWORD=[TU-CONTRASEÑA-DE-APLICACIÓN-GMAIL-16-CARACTERES]
PAYPHONE_ENVIRONMENT=sandbox
PAYPHONE_TOKEN=[TU-PAYPHONE-TOKEN]
PAYPHONE_STORE_ID=[TU-PAYPHONE-STORE-ID]
PAYPHONE_RESPONSE_URL=https://easy-storev2.vercel.app/api/payphone/callback
PAYPHONE_MERCHANT_NAME=Easy Store
PAYPHONE_MERCHANT_EMAIL=easystoreecu@gmail.com
PAYPHONE_CURRENCY=USD
PAYPHONE_CONFIRM_SECRET=[SECRET-ALEATORIO-PARA-CONFIRMACION-PAGOS-PENDIENTES]
```

---

## ⚠️ IMPORTANTE

### Variables Críticas para el Panel Admin

Las siguientes variables son **especialmente críticas** para que el panel admin funcione en producción:

1. **`NEXTAUTH_URL`** - DEBE ser exactamente: `https://easy-storev2.vercel.app` (sin barra final)
2. **`NEXTAUTH_SECRET`** - Debe ser diferente al de desarrollo, genera uno nuevo
3. **`GOOGLE_CLIENT_ID`** y **`GOOGLE_CLIENT_SECRET`** - Con las URLs correctas configuradas en Google Cloud Console

### Verificación en Google Cloud Console

Asegúrate de que en [Google Cloud Console](https://console.cloud.google.com/apis/credentials) tengas configurado:

- **Orígenes autorizados:**
  - `https://easy-storev2.vercel.app`

- **URI de redirección autorizadas:**
  - `https://easy-storev2.vercel.app/api/auth/callback/google`

### Payphone

Las configuraciones de Payphone se pueden guardar de dos formas:
1. **En la base de datos** (recomendado) - Desde el panel admin en `/admin` > pestaña "Payphone"
2. **Variables de entorno** - Como fallback si no están en la base de datos

---

## 🔍 CÓMO VERIFICAR QUE ESTÁN CONFIGURADAS

Después de agregar las variables en Vercel:

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Verifica que todas las variables críticas estén presentes
4. Asegúrate de que el selector de entorno muestre "Production"
5. Haz un nuevo deploy después de agregar las variables

---

## 📞 TROUBLESHOOTING

### Problema: No puedo acceder al panel admin en producción

**Solución:**
1. Verifica que `NEXTAUTH_URL` sea exactamente `https://easy-storev2.vercel.app` (sin barra final)
2. Verifica que `NEXTAUTH_SECRET` esté configurado y sea diferente al de desarrollo
3. Verifica que las URLs en Google Cloud Console coincidan con tu dominio
4. Revisa los logs de Vercel para ver errores específicos

### Problema: Error de conexión a la base de datos

**Solución:**
1. Verifica que `DATABASE_URL` use el pooler de Supabase (puerto 6543)
2. Asegúrate de incluir `?pgbouncer=true&connection_limit=1` en la URL
3. Verifica que la contraseña sea correcta

### Problema: No se envían emails

**Solución:**
1. Verifica que uses una contraseña de aplicación de Gmail, no tu contraseña normal
2. Asegúrate de que la verificación en 2 pasos esté activada en tu cuenta de Google
3. Verifica que `SMTP_USER` y `SMTP_PASS` sean correctos

