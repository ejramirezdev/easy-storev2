# 🔧 Solución: Error 400 Redirect URI Mismatch con Google OAuth

## 📋 Problema

Después de cambiar el dominio a `easystoreecu.com`, aparece el error:
```
400 redirect uri mismatch
```

## ✅ Solución

Necesitas actualizar **2 lugares**:

### 1️⃣ Variables de Entorno en Vercel

Ve a tu proyecto en Vercel y actualiza estas variables:

1. **Settings** > **Environment Variables**
2. Busca y actualiza estas variables (asegúrate de seleccionar **Production**):
   - `NEXTAUTH_URL` → `https://easystoreecu.com` (sin barra final)
   - `NEXT_PUBLIC_SITE_URL` → `https://easystoreecu.com`
   - `NEXT_PUBLIC_BASE_URL` → `https://easystoreecu.com`
   - `PAYPHONE_RESPONSE_URL` → `https://easystoreecu.com/api/payphone/callback`

3. **IMPORTANTE**: Después de actualizar las variables, haz un **nuevo deploy** en Vercel.

### 2️⃣ Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Selecciona tu proyecto
3. Busca tu **OAuth 2.0 Client ID** (el que usas para autenticación)
4. Haz clic en el nombre para editarlo
5. En **Orígenes autorizados**, agrega:
   ```
   https://easystoreecu.com
   ```
   (Si ya tienes el dominio anterior, puedes dejarlo o eliminarlo)

6. En **URI de redirección autorizadas**, agrega:
   ```
   https://easystoreecu.com/api/auth/callback/google
   ```
   (Esta es la URI que NextAuth usa automáticamente)

7. Haz clic en **Guardar**

## 🔍 Verificación

Después de hacer los cambios:

1. ✅ Espera unos minutos (Google puede tardar en propagar los cambios)
2. ✅ Haz un nuevo deploy en Vercel si actualizaste variables de entorno
3. ✅ Intenta iniciar sesión con Google nuevamente

## ⚠️ Notas Importantes

- **No agregues barras finales** (`/`) en las URLs
- La URI de callback de NextAuth es **siempre**: `{NEXTAUTH_URL}/api/auth/callback/google`
- Si `NEXTAUTH_URL=https://easystoreecu.com`, entonces la callback será: `https://easystoreecu.com/api/auth/callback/google`
- Los cambios en Google Cloud Console pueden tardar **hasta 5 minutos** en aplicarse

## 🐛 Si el problema persiste

1. Verifica que las variables de entorno en Vercel estén correctas (sin espacios, sin barras finales)
2. Verifica que en Google Cloud Console la URI de redirección sea **exactamente**: `https://easystoreecu.com/api/auth/callback/google`
3. Limpia la caché del navegador o prueba en modo incógnito
4. Revisa los logs de Vercel para ver si hay errores adicionales

