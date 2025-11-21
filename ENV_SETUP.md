# Guía de Configuración de Variables de Entorno

## 📋 Resumen

Este proyecto requiere varias variables de entorno para funcionar correctamente. Este documento explica cómo configurarlas.

## 🚀 Inicio Rápido

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Para producción, usa como referencia:**
   ```bash
   .env.production
   ```

3. **Completa todas las variables** con tus credenciales reales.

## 📝 Variables Requeridas

### 🔴 Críticas (Sin estas, la app no funcionará)

#### Base de Datos
- `DATABASE_URL` - URL de conexión a PostgreSQL (Supabase o similar)

#### NextAuth
- `NEXTAUTH_SECRET` - Secret para NextAuth (genera uno: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - URL de tu aplicación en producción

#### Google OAuth
- `GOOGLE_CLIENT_ID` - Client ID de Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - Client Secret de Google Cloud Console

### 🟡 Importantes (Funcionalidades limitadas sin estas)

#### AWS S3
- `AWS_ACCESS_KEY_ID` - Access Key ID de AWS
- `AWS_SECRET_ACCESS_KEY` - Secret Access Key de AWS
- `AWS_REGION` - Región de AWS (ej: us-east-2)
- `AWS_S3_BUCKET_NAME` - Nombre del bucket S3
- `AWS_S3_BUCKET_URL` - URL pública del bucket

#### SMTP
- `SMTP_USER` - Usuario SMTP (email)
- `SMTP_PASS` - Contraseña SMTP (o contraseña de aplicación Gmail)
- `SMTP_HOST` - Host SMTP (ej: smtp.gmail.com)
- `SMTP_PORT` - Puerto SMTP (ej: 587)
- `SMTP_SECURE` - true/false (false para Gmail)
- `SMTP_FROM` - Email remitente

### 🟢 Opcionales (Mejoran funcionalidades)

#### Payphone
- `PAYPHONE_ENVIRONMENT` - sandbox o production
- `PAYPHONE_TOKEN` - Token de Payphone
- `PAYPHONE_STORE_ID` - Store ID de Payphone
- `PAYPHONE_RESPONSE_URL` - URL de respuesta
- `PAYPHONE_MERCHANT_NAME` - Nombre del comerciante
- `PAYPHONE_MERCHANT_EMAIL` - Email del comerciante
- `PAYPHONE_CURRENCY` - Moneda (ej: USD)
- `PAYPHONE_CONFIRM_SECRET` - Secret para confirmación

#### Next.js
- `NEXT_PUBLIC_SITE_URL` - URL pública del sitio
- `NEXT_PUBLIC_BASE_URL` - URL base (alternativa)

## 🔧 Cómo Obtener las Credenciales

### Google OAuth
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+
4. Ve a "Credenciales" > "Crear credenciales" > "ID de cliente OAuth"
5. Configura:
   - Tipo: Aplicación web
   - Orígenes autorizados: `https://easy-storev2.vercel.app`
   - Redirect URIs: `https://easy-storev2.vercel.app/api/auth/callback/google`

### AWS S3
1. Crea una cuenta en AWS
2. Ve a IAM y crea un usuario con permisos de S3
3. Genera Access Key y Secret Key
4. Crea un bucket S3 en la región deseada
5. Configura CORS y permisos públicos según necesites

### Gmail SMTP (Contraseña de Aplicación)
1. Ve a tu cuenta de Google
2. Seguridad > Verificación en 2 pasos (debe estar activada)
3. Contraseñas de aplicaciones > Generar nueva
4. Selecciona "Correo" y dispositivo
5. Copia la contraseña generada (16 caracteres sin espacios)

### NEXTAUTH_SECRET
Genera un secret seguro:
```bash
openssl rand -base64 32
```

## 🌐 Configuración para Vercel (Producción)

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega todas las variables del archivo `.env.production`
4. Asegúrate de que:
   - `NODE_ENV=production`
   - `NEXTAUTH_URL` coincida exactamente con tu dominio
   - `NEXT_PUBLIC_SITE_URL` sea tu URL de producción

## ⚠️ Seguridad

- **NUNCA** subas archivos `.env` a git
- Usa secretos diferentes para desarrollo y producción
- Rota los secretos regularmente
- Usa contraseñas de aplicación para Gmail, no tu contraseña normal
- Limita los permisos de las credenciales de AWS

## 🔍 Verificación

Después de configurar las variables:

1. **Desarrollo:**
   ```bash
   npm run dev
   ```

2. **Producción:**
   ```bash
   npm run build
   ```

3. Verifica que no haya errores relacionados con variables de entorno faltantes.

## 📚 Recursos

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [AWS S3 Setup](https://docs.aws.amazon.com/s3/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

