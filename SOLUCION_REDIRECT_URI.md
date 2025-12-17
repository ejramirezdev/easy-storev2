# 🔧 Solución Rápida: Error 400 redirect_uri_mismatch

## ⚠️ El Problema

Google está rechazando la solicitud porque la URI de redirección no coincide con las configuradas en Google Cloud Console.

**NextAuth construye automáticamente la callback URL como:**
```
{NEXTAUTH_URL}/api/auth/callback/google
```

Si `NEXTAUTH_URL` en Vercel aún es `https://easy-storev2.vercel.app`, entonces la callback será:
```
https://easy-storev2.vercel.app/api/auth/callback/google
```

Pero Google Cloud Console probablemente solo tiene configurado:
```
https://easystoreecu.com/api/auth/callback/google
```

## ✅ Solución (2 pasos obligatorios)

### Paso 1: Actualizar Variables en Vercel

1. Ve a tu proyecto en **Vercel**
2. **Settings** > **Environment Variables**
3. Busca y actualiza estas variables (asegúrate de seleccionar **Production**):
   - `NEXTAUTH_URL` → `https://easystoreecu.com` ⚠️ **SIN barra final**
   - `NEXT_PUBLIC_SITE_URL` → `https://easystoreecu.com`
   - `NEXT_PUBLIC_BASE_URL` → `https://easystoreecu.com`
   - `PAYPHONE_RESPONSE_URL` → `https://easystoreecu.com/api/payphone/callback`

4. **IMPORTANTE**: Después de actualizar, haz un **nuevo deploy**:
   - Ve a **Deployments**
   - Haz clic en los 3 puntos del último deploy
   - Selecciona **Redeploy**

### Paso 2: Configurar Google Cloud Console

1. Ve a [Google Cloud Console - Credenciales](https://console.cloud.google.com/apis/credentials)
2. Selecciona tu proyecto
3. Busca tu **OAuth 2.0 Client ID** (el que usas para autenticación)
4. Haz clic en el nombre para **editarlo**
5. En **"Orígenes autorizados"**, agrega:
   ```
   https://easystoreecu.com
   ```
   (Puedes dejar el anterior si quieres, pero no es necesario)

6. En **"URI de redirección autorizadas"**, agrega:
   ```
   https://easystoreecu.com/api/auth/callback/google
   ```
   ⚠️ **DEBE ser exactamente esta URL, sin barras finales**

7. Haz clic en **"Guardar"**

## ⏱️ Tiempo de Propagación

- **Vercel**: Los cambios se aplican inmediatamente después del redeploy (1-2 minutos)
- **Google**: Puede tardar **hasta 5 minutos** en propagar los cambios

## ✅ Verificación

1. Espera 5 minutos después de guardar en Google Cloud Console
2. Asegúrate de que el redeploy en Vercel haya terminado
3. Limpia la caché del navegador o prueba en modo incógnito
4. Intenta iniciar sesión con Google nuevamente

## 🐛 Si el problema persiste

1. **Verifica en Vercel** que las variables estén correctas:
   - Ve a **Settings** > **Environment Variables**
   - Confirma que `NEXTAUTH_URL=https://easystoreecu.com` (sin espacios, sin barra final)
   - Asegúrate de que el selector de entorno muestre **"Production"**

2. **Verifica en Google Cloud Console**:
   - La URI debe ser **exactamente**: `https://easystoreecu.com/api/auth/callback/google`
   - No debe tener espacios al inicio o final
   - No debe tener barra final (`/`)

3. **Revisa los logs de Vercel**:
   - Ve a **Deployments** > Selecciona el último deploy > **Functions** > Busca errores relacionados con NextAuth

4. **Prueba en modo incógnito** para descartar problemas de caché del navegador

## 📝 Nota Importante

Los cambios que hice en el código local (archivos `.tsx`, `.ts`, `.env`) **NO afectan el deploy en Vercel**. Las variables de entorno en Vercel son independientes y **debes actualizarlas manualmente** en el dashboard de Vercel.

