# ⚡ Resumen Rápido: Configuración SEO (5 minutos)

## 🎯 Paso 1: Google Search Console (2 minutos)

### 1.1 Crear cuenta
1. Ve a: https://search.google.com/search-console
2. Inicia sesión con Google
3. Clic en **"Agregar propiedad"**
4. Selecciona **"Prefijo de URL"**
5. Ingresa: `https://easystoreecu.com`
6. Clic en **"Continuar"**

### 1.2 Verificar propiedad
- Google te mostrará un código como: `<meta name="google-site-verification" content="ABC123XYZ789" />`
- **Copia solo la parte del código**: `ABC123XYZ789` (sin las etiquetas HTML)

### 1.3 Agregar código en tu app
1. Abre: `app/layout.tsx`
2. Busca la línea 88-93 (sección `verification`)
3. Descomenta y agrega tu código:

```typescript
verification: {
  google: "ABC123XYZ789", // ← Pega tu código aquí (sin comillas HTML)
  // bing: "tu-codigo-bing", // Descomenta cuando lo tengas
},
```

4. Guarda el archivo
5. Haz commit y push a tu repositorio
6. Vercel hará deploy automáticamente

### 1.4 Volver a Google Search Console
1. Clic en **"Verificar"**
2. ✅ Deberías ver: **"Propiedad verificada"**

---

## 🗺️ Paso 2: Enviar Sitemap (1 minuto)

1. En Google Search Console, menú lateral → **"Sitemaps"**
2. En el campo **"Agregar un nuevo sitemap"**, escribe:
   ```
   sitemap.xml
   ```
3. Clic en **"Enviar"**
4. ✅ Espera unos minutos, debería mostrar: **"Correcto"**

**Tu sitemap está en**: `https://easystoreecu.com/sitemap.xml`

---

## 📊 Paso 3: Google Analytics (2 minutos)

### 3.1 Crear propiedad
1. Ve a: https://analytics.google.com/
2. Clic en **"Comenzar a medir"**
3. Completa:
   - Nombre: **Easy Store Ecuador**
   - Zona horaria: **Ecuador (GMT-5)**
   - Moneda: **USD**
4. Clic en **"Crear"**

### 3.2 Obtener Measurement ID
- Verás un código como: `G-XXXXXXXXXX`
- **Copia este código completo**

### 3.3 Agregar a Vercel
1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Clic en **"Add New"**
4. Completa:
   - **Name**: `NEXT_PUBLIC_GA_ID`
   - **Value**: `G-XXXXXXXXXX` (tu código)
   - **Environment**: Selecciona **Production**
5. Clic en **"Save"**
6. Ve a **Deployments** → Clic en los 3 puntos del último deploy → **Redeploy**

### 3.4 Verificar que funciona
1. Visita: `https://easystoreecu.com`
2. En Google Analytics → **"Tiempo real"**
3. ✅ Deberías ver tu visita (puede tardar 1-2 minutos)

---

## 📈 Paso 4: Monitorear (Ongoing)

### Revisar semanalmente:

#### Google Search Console:
1. **Rendimiento** → Ver impresiones y clics
2. **Cobertura** → Verificar que no hay errores
3. **Sitemaps** → Confirmar que sigue procesado correctamente

#### Google Analytics:
1. **Adquisición** → **Canales** → Ver tráfico orgánico
2. **Comportamiento** → **Contenido del sitio** → Ver páginas más visitadas

---

## 🔍 Verificación rápida

### ✅ Checklist:
- [ ] Código de Google agregado en `app/layout.tsx`
- [ ] Deploy realizado en Vercel
- [ ] Propiedad verificada en Google Search Console
- [ ] Sitemap enviado y procesado
- [ ] `NEXT_PUBLIC_GA_ID` agregado en Vercel
- [ ] Redeploy realizado
- [ ] Google Analytics muestra datos en tiempo real

---

## 🆘 Si algo no funciona

### El código de verificación no funciona:
- ✅ Verifica que el código esté en producción (haz redeploy)
- ✅ Asegúrate de copiar solo el código, sin las etiquetas `<meta>`
- ✅ Espera 5-10 minutos después del deploy

### El sitemap muestra errores:
- ✅ Verifica que `https://easystoreecu.com/sitemap.xml` sea accesible
- ✅ Asegúrate de que todas las URLs usen HTTPS

### Google Analytics no muestra datos:
- ✅ Verifica que `NEXT_PUBLIC_GA_ID` esté en Vercel (Production)
- ✅ Haz un redeploy después de agregar la variable
- ✅ Espera 24-48 horas para ver datos históricos

---

## 📝 Notas importantes

1. **Los datos pueden tardar**: Google Search Console y Analytics pueden tardar 24-48 horas en mostrar datos completos
2. **Sitemap se actualiza automáticamente**: Cada vez que agregas un producto nuevo, el sitemap se regenera
3. **Revisa regularmente**: Revisa métricas al menos una vez por semana

---

**¿Listo?** Sigue los pasos en orden y en 5 minutos tendrás todo configurado. 🚀

