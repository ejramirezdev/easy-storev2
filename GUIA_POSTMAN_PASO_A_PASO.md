# Guía Paso a Paso para Probar Payphone en Postman

## Datos de Prueba Actuales

### Token (completo, sin "Bearer")
```
vNrS9x0psd2pnrcW2p3KTtF7w-3-A9qQUbm638jGCIc_MVctDTN9bE_eZ9ky14aQa3z5VAXxUyEVDUWXTicV9W31FiXbibL1Hnx6W0P3tQBasElDhPkD0A8NzDAtQJMcXOuSqZn_hSlRnH2mfVVKvJTT3hE2mBXVwJFMG5GKTz1QnFDNZi5vnJBOZQ5g51glHF9v0I91r2jx8KnfL74piZJnyv7PioC45ND8XFpFoagAr6vYuev3p4SR983YmpGdPn4pC0e03ZZWsLSn6B3c2b1FVwa8zkHpF7B-MAlRUcrJT418Vw7A2WxOjD3ZF2gGUATc9w
```

### ID de Transacción
```
69555614
```

### Client Transaction ID
```
2272b214251106-1301-1826
```

## Pasos en Postman

### Paso 1: Crear Nueva Solicitud
1. Abre Postman
2. Haz clic en **"New"** o **"+"** para crear una nueva solicitud
3. O importa la colección `postman-collection-payphone.json`

### Paso 2: Configurar Método y URL
1. Selecciona el método: **POST**
2. En el campo URL, pega:
   ```
   https://pay.payphonetodoesposible.com/api/button/V2/Confirm
   ```

### Paso 3: Configurar Headers
1. Ve a la pestaña **"Headers"**
2. Agrega los siguientes headers (uno por uno):

   **Header 1:**
   - **Key:** `Content-Type`
   - **Value:** `application/json`
   - ✅ Marca la casilla para activarlo

   **Header 2:**
   - **Key:** `Authorization`
   - **Value:** `Bearer vNrS9x0psd2pnrcW2p3KTtF7w-3-A9qQUbm638jGCIc_MVctDTN9bE_eZ9ky14aQa3z5VAXxUyEVDUWXTicV9W31FiXbibL1Hnx6W0P3tQBasElDhPkD0A8NzDAtQJMcXOuSqZn_hSlRnH2mfVVKvJTT3hE2mBXVwJFMG5GKTz1QnFDNZi5vnJBOZQ5g51glHF9v0I91r2jx8KnfL74piZJnyv7PioC45ND8XFpFoagAr6vYuev3p4SR983YmpGdPn4pC0e03ZZWsLSn6B3c2b1FVwa8zkHpF7B-MAlRUcrJT418Vw7A2WxOjD3ZF2gGUATc9w`
   - ✅ Marca la casilla para activarlo

   **IMPORTANTE:** 
   - NO agregues el header `Referer` (no aparece en el ejemplo que funciona)
   - El token completo va después de "Bearer " (con espacio)

### Paso 4: Configurar Body
1. Ve a la pestaña **"Body"**
2. Selecciona **"raw"**
3. En el dropdown de la derecha, selecciona **"JSON"**
4. Pega este JSON exacto:
   ```json
   {
     "id": 69555614,
     "clientTxId": "2272b214251106-1301-1826"
   }
   ```

   **IMPORTANTE:**
   - `id` debe ser un número (sin comillas)
   - `clientTxId` debe ser un string (con comillas)
   - No uses `clientTransactionId`, usa `clientTxId`

### Paso 5: Enviar Solicitud
1. Haz clic en el botón **"Send"** (azul, arriba a la derecha)
2. Espera la respuesta

## Respuesta Esperada

### Si Funciona Correctamente (200 OK)
Deberías recibir un JSON como este:
```json
{
  "email": "ejramirezdev@gmail.com",
  "cardType": "Debit",
  "bin": "438108",
  "lastDigits": "2054",
  "statusCode": 2,
  "transactionStatus": "Canceled",
  "authorizationCode": "W69555614",
  "message": "Cancelada",
  "messageCode": 34,
  "transactionId": 69555614,
  "clientTransactionId": "2272b214251106-1301-1826",
  "amount": 7000,
  "currency": "USD",
  ...
}
```

**Nota:** 
- `statusCode: 2` = Canceled
- `statusCode: 3` = Approved
- Aunque la transacción esté cancelada, si recibes JSON válido significa que la API funciona correctamente

### Si Hay Error (500)
Recibirás HTML con "Runtime Error" - esto indica un problema con los datos o el servidor de Payphone.

## Verificación de Headers

Antes de enviar, verifica que los headers se vean así en Postman:

```
Content-Type: application/json
Authorization: Bearer vNrS9x0psd2pnrcW2p3KTtF7w-3-A9qQUbm638jGCIc_MVctDTN9bE_eZ9ky14aQa3z5VAXxUyEVDUWXTicV9W31FiXbibL1Hnx6W0P3tQBasElDhPkD0A8NzDAtQJMcXOuSqZn_hSlRnH2mfVVKvJTT3hE2mBXVwJFMG5GKTz1QnFDNZi5vnJBOZQ5g51glHF9v0I91r2jx8KnfL74piZJnyv7PioC45ND8XFpFoagAr6vYuev3p4SR983YmpGdPn4pC0e03ZZWsLSn6B3c2b1FVwa8zkHpF7B-MAlRUcrJT418Vw7A2WxOjD3ZF2gGUATc9w
```

## Troubleshooting

### Error: "Invalid JSON"
- Verifica que el body esté en formato "raw" y "JSON"
- Verifica que no haya comas extras o caracteres inválidos

### Error: "Unauthorized" (401)
- Verifica que el token esté completo
- Verifica que el header Authorization tenga el formato: `Bearer <token>` (con espacio)

### Error: 500 Internal Server Error
- Verifica que el `id` sea un número (no string)
- Verifica que `clientTxId` sea exactamente el mismo que recibiste en el callback
- Verifica que no haya headers extra (como `Referer`)

### La respuesta es HTML en lugar de JSON
- Esto indica un error 500 del servidor
- Verifica todos los datos anteriores
- Contacta a Payphone con los datos exactos que estás enviando

