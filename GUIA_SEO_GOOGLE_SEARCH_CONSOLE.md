# 🔍 Guía Completa: Configuración SEO y Google Search Console

## 📋 Índice
1. [Configurar Google Search Console](#1-configurar-google-search-console)
2. [Verificar el sitemap](#2-verificar-el-sitemap)
3. [Agregar códigos de verificación](#3-agregar-códigos-de-verificación)
4. [Configurar Google Analytics](#4-configurar-google-analytics)
5. [Monitorear el rendimiento SEO](#5-monitorear-el-rendimiento-seo)

---

## 1. Configurar Google Search Console

### Paso 1: Crear cuenta en Google Search Console

1. Ve a [Google Search Console](https://search.google.com/search-console)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en **"Agregar propiedad"** o **"Add property"**

### Paso 2: Agregar tu sitio web

Tienes dos opciones:

#### Opción A: Dominio (Recomendado)
- Selecciona **"Dominio"**
- Ingresa: `easystoreecu.com`
- Haz clic en **"Continuar"**

#### Opción B: Prefijo de URL
- Selecciona **"Prefijo de URL"**
- Ingresa: `https://easystoreecu.com`
- Haz clic en **"Continuar"**

### Paso 3: Verificar la propiedad

Google te pedirá verificar que eres el dueño del sitio. Sigue los pasos en la sección [3. Agregar códigos de verificación](#3-agregar-códigos-de-verificación) más abajo.

---

## 2. Verificar el sitemap

### Paso 1: Enviar el sitemap a Google

1. Una vez verificada tu propiedad en Google Search Console:
2. En el menú lateral, ve a **"Sitemaps"** (o "Mapas del sitio")
3. En el campo **"Agregar un nuevo sitemap"**, ingresa:
   ```
   sitemap.xml
   ```
4. Haz clic en **"Enviar"**

### Paso 2: Verificar que se procesó correctamente

- Espera unos minutos (puede tardar hasta 24 horas)
- Deberías ver el estado: **"Correcto"** o **"Success"**
- Si hay errores, Google te mostrará qué URLs tienen problemas

### Paso 3: Verificar URLs indexadas

1. Ve a **"Cobertura"** o **"Coverage"** en el menú lateral
2. Aquí verás:
   - **Válidas**: URLs que Google puede indexar
   - **Válidas con advertencias**: URLs indexadas pero con problemas menores
   - **Errores**: URLs que no se pueden indexar
   - **Excluidas**: URLs que no deben indexarse (normal)

### Paso 4: Solicitar indexación manual (opcional)

Si quieres que Google indexe una página específica rápidamente:

1. Ve a **"Inspección de URL"** o **"URL Inspection"**
2. Ingresa la URL completa (ej: `https://easystoreecu.com/products/ssd-kingston-960gb`)
3. Haz clic en **"Solicitar indexación"** o **"Request Indexing"**

---

## 3. Agregar códigos de verificación

### Paso 1: Obtener el código de verificación de Google

1. En Google Search Console, después de agregar tu propiedad:
2. Selecciona el método de verificación: **"Etiqueta HTML"**
3. Copia el código que te proporciona (ejemplo):
   ```html
   <meta name="google-site-verification" content="TU-CODIGO-AQUI" />
   ```

### Paso 2: Agregar el código en tu aplicación

1. Abre el archivo `app/layout.tsx`
2. Busca la sección `verification` en el objeto `metadata`
3. Agrega tu código:

```typescript
verification: {
  google: "TU-CODIGO-AQUI", // Sin el <meta> tag, solo el código
  // bing: "TU-CODIGO-BING", // Cuando lo tengas
  // yandex: "TU-CODIGO-YANDEX", // Si usas Yandex
},
```

**Ejemplo completo:**
```typescript
export const metadata: Metadata = {
  // ... otros campos ...
  verification: {
    google: "abc123def456ghi789", // Tu código de Google
    bing: "xyz789abc123", // Tu código de Bing (opcional)
  },
};
```

### Paso 3: Verificar en Google Search Console

1. Haz clic en **"Verificar"** en Google Search Console
2. Si todo está correcto, verás: **"Propiedad verificada"**

### Paso 4: Verificar en Bing Webmaster Tools (Opcional)

1. Ve a [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Agrega tu sitio: `https://easystoreecu.com`
3. Selecciona **"Agregar etiqueta meta"** como método de verificación
4. Copia el código y agrégalo en `app/layout.tsx` como se muestra arriba

---

## 4. Configurar Google Analytics

### Paso 1: Crear cuenta de Google Analytics

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en **"Comenzar a medir"** o **"Start measuring"**

### Paso 2: Crear una propiedad

1. **Nombre de la cuenta**: Easy Store (o el que prefieras)
2. **Nombre de la propiedad**: Easy Store Ecuador
3. **Zona horaria**: (GMT-05:00) Ecuador
4. **Moneda**: USD
5. Haz clic en **"Siguiente"**

### Paso 3: Configurar información del negocio

1. **Industria**: Retail/E-commerce
2. **Tamaño del negocio**: Elige según corresponda
3. **Objetivos**: Selecciona los que apliquen (Vender productos, Generar leads, etc.)
4. Haz clic en **"Crear"**

### Paso 4: Obtener el Measurement ID

1. Después de crear la propiedad, verás tu **Measurement ID**
2. Formato: `G-XXXXXXXXXX`
3. Copia este ID

### Paso 5: Agregar Google Analytics a tu aplicación

1. Ve a tu proyecto en **Vercel**
2. **Settings** > **Environment Variables**
3. Agrega la variable:
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
   (Reemplaza `G-XXXXXXXXXX` con tu Measurement ID real)
4. Selecciona **"Production"** en el selector de entorno
5. Haz clic en **"Save"**
6. Haz un **nuevo deploy** en Vercel

### Paso 6: Verificar que funciona

1. Después del deploy, visita tu sitio: `https://easystoreecu.com`
2. Ve a Google Analytics > **"Tiempo real"** o **"Realtime"**
3. Deberías ver tu visita en tiempo real (puede tardar unos minutos)

---

## 5. Monitorear el rendimiento SEO

### En Google Search Console

#### 1. Rendimiento (Performance)

1. Ve a **"Rendimiento"** o **"Performance"** en el menú lateral
2. Aquí verás:
   - **Impresiones**: Cuántas veces apareció tu sitio en búsquedas
   - **Clics**: Cuántas veces hicieron clic en tu sitio
   - **CTR** (Click-Through Rate): Porcentaje de clics vs impresiones
   - **Posición promedio**: En qué posición aparece tu sitio en promedio

#### 2. Consultas (Queries)

- Ve a la pestaña **"Consultas"** dentro de Rendimiento
- Verás qué palabras clave están generando tráfico
- Identifica oportunidades para mejorar contenido

#### 3. Páginas (Pages)

- Ve a la pestaña **"Páginas"** dentro de Rendimiento
- Verás qué páginas reciben más tráfico
- Identifica tus páginas más exitosas

#### 4. Cobertura (Coverage)

- Ve a **"Cobertura"** o **"Coverage"**
- Monitorea qué URLs están indexadas
- Revisa errores y advertencias regularmente

#### 5. Mejoras (Enhancements)

- Ve a **"Mejoras"** o **"Enhancements"**
- Verifica que tus structured data (Product, Organization) se estén detectando correctamente

### En Google Analytics

#### 1. Adquisición (Acquisition)

1. Ve a **"Adquisición"** > **"Todo el tráfico"** > **"Canales"**
2. Verás de dónde viene tu tráfico:
   - **Orgánico**: Búsquedas en Google
   - **Directo**: Visitantes que escriben tu URL
   - **Referencia**: Otros sitios que te enlazan
   - **Social**: Redes sociales

#### 2. Comportamiento (Behavior)

1. Ve a **"Comportamiento"** > **"Contenido del sitio"** > **"Todas las páginas"**
2. Verás qué páginas son más visitadas
3. Identifica qué productos/servicios generan más interés

#### 3. Conversiones (Conversions)

1. Configura objetivos en Google Analytics (ej: completar una compra)
2. Monitorea cuántas conversiones vienen de búsquedas orgánicas
3. Mide el ROI de tu SEO

### Métricas clave a monitorear

#### Semanalmente:
- ✅ Impresiones en Google Search Console
- ✅ Clics orgánicos
- ✅ Posición promedio de palabras clave importantes
- ✅ Errores de indexación

#### Mensualmente:
- ✅ Tráfico orgánico total (Google Analytics)
- ✅ Páginas más visitadas
- ✅ Tasa de rebote
- ✅ Tiempo en el sitio
- ✅ Conversiones desde búsquedas orgánicas

---

## 🔧 Solución de problemas comunes

### Problema: El sitemap muestra errores

**Solución:**
1. Verifica que `https://easystoreecu.com/sitemap.xml` sea accesible
2. Revisa que no haya URLs con errores 404
3. Asegúrate de que todas las URLs usen HTTPS

### Problema: Las páginas no se están indexando

**Solución:**
1. Verifica que `robots.txt` no esté bloqueando las páginas
2. Solicita indexación manual desde "Inspección de URL"
3. Asegúrate de que las páginas tengan contenido único y relevante

### Problema: Google Analytics no muestra datos

**Solución:**
1. Verifica que `NEXT_PUBLIC_GA_ID` esté configurado en Vercel
2. Asegúrate de que el código esté en producción (haz un redeploy)
3. Espera 24-48 horas para ver datos históricos

---

## 📚 Recursos adicionales

- [Google Search Console Help](https://support.google.com/webmasters)
- [Google Analytics Academy](https://analytics.google.com/analytics/academy/)
- [Google Search Central](https://developers.google.com/search)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)

---

## ✅ Checklist de configuración

- [ ] Cuenta de Google Search Console creada
- [ ] Sitio verificado en Google Search Console
- [ ] Sitemap enviado y procesado correctamente
- [ ] Código de verificación agregado en `app/layout.tsx`
- [ ] Google Analytics configurado
- [ ] `NEXT_PUBLIC_GA_ID` agregado en Vercel
- [ ] Deploy realizado con las nuevas configuraciones
- [ ] Verificado que Analytics funciona en tiempo real
- [ ] Configurado recordatorio para revisar métricas semanalmente

---

**Nota**: Los datos en Google Search Console y Analytics pueden tardar 24-48 horas en aparecer después de la configuración inicial. Sé paciente y revisa regularmente.

