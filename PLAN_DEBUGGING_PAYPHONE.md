# Plan de Debugging - Endpoint de Confirmación Payphone

## Problema Actual
- El endpoint `/api/button/V2/Confirm` devuelve error 500 con HTML en lugar de JSON
- Payphone confirmó que el endpoint funciona y envió un ejemplo exitoso
- Nuestro formato de `clientTxId` es diferente al ejemplo exitoso

## Análisis del Ejemplo Exitoso

### Ejemplo de Payphone (FUNCIONA):
```json
{
  "id": 23178284,
  "clientTxId": "BR231121-1142-0215"
}
```

**Características del clientTxId exitoso:**
- Formato: `BR231121-1142-0215`
- Parece ser: `[PREFIJO][FECHA]-[HORA]-[RANDOM]`
- Longitud: 18 caracteres
- Sin UUIDs

### Nuestro Formato Actual (NO FUNCIONA):
```json
{
  "id": 69554590,
  "clientTxId": "5daff9f6-2451387723-389rwy"
}
```

**Características de nuestro clientTxId:**
- Formato: `[UUID_SHORT]-[TIMESTAMP]-[RANDOM]`
- Ejemplo: `5daff9f6-2451387723-389rwy`
- Longitud: 26 caracteres
- Incluye UUID parcial

## Posibles Causas del Error 500

1. **Formato del clientTxId incompatible**
   - Payphone podría no aceptar UUIDs en el clientTxId
   - El formato con timestamp largo podría causar problemas

2. **Headers faltantes**
   - El ejemplo incluye `Referer` header (✅ ya agregado)
   - Podría faltar otro header

3. **ID de transacción inválido**
   - El `id` que recibimos podría no ser válido para confirmar
   - Podría ser que necesitemos esperar un momento después del pago

4. **Problema con el token/storeId en sandbox**
   - Aunque Payphone dice que funciona, podría haber restricciones

## Plan de Acción

### Paso 1: Probar con el formato exacto del ejemplo
- Intentar usar un formato similar al ejemplo exitoso
- Generar clientTxId sin UUIDs, usando solo prefijo + fecha + hora + random

### Paso 2: Verificar headers
- ✅ Agregar header `Referer` (ya implementado)
- Verificar si hay otros headers necesarios

### Paso 3: Probar diferentes formatos de clientTxId
1. Formato exacto del ejemplo: `BR231121-1142-0215`
2. Solo orderId corto: `5daff9f6`
3. OrderId completo: `5daff9f6-02c2-4588-a64e-72cd1cb57335`
4. Formato actual: `5daff9f6-2451387723-389rwy`

### Paso 4: Verificar timing
- Podría ser que necesitemos esperar unos segundos después del callback
- El ID de transacción podría no estar disponible inmediatamente

### Paso 5: Contactar a Payphone con logs específicos
- Si nada funciona, enviar logs detallados a Payphone
- Incluir el payload exacto que estamos enviando
- Preguntar si hay restricciones específicas para sandbox

## Implementación Inmediata

1. ✅ Agregar header `Referer` (ya hecho)
2. Cambiar formato de generación de clientTxId para que sea más simple
3. Agregar más logging para debugging
4. Probar con diferentes formatos automáticamente

