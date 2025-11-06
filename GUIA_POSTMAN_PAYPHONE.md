# Guía para Probar el Endpoint de Payphone en Postman

## Configuración de la Solicitud

### 1. Método y URL
- **Método**: `POST`
- **URL**: `https://pay.payphonetodoesposible.com/api/button/V2/Confirm`

### 2. Headers
Agregar los siguientes headers:

```
Content-Type: application/json
Authorization: Bearer vNrS9x0psd2pnrcW2p3KTtF7w-3-A9qQUbm638jGCIc_MVctDTN9bE_eZ9ky14aQa3z5VAXxUyEVDUWXTicV9W31FiXbibL1Hnx6W0P3tQBasElDhPkD0A8NzDAtQJMcXOuSqZn_hSlRnH2mfVVKvJTT3hE2mBXVwJFMG5GKTz1QnFDNZi5vnJBOZQ5g51glHF9v0I91r2jx8KnfL74piZJnyv7PioC45ND8XFpFoagAr6vYuev3p4SR983YmpGdPn4pC0e03ZZWsLSn6B3c2b1FVwa8zkHpF7B-MAlRUcrJT418Vw7A2WxOjD3ZF2gGUATc9w
Referer: http://localhost:3000/api/payphone/callback
```

### 3. Body (raw JSON)
Seleccionar `raw` y `JSON`, luego pegar:

```json
{
  "id": 69555614,
  "clientTxId": "2272b214251106-1301-1826"
}
```

## Casos de Prueba a Probar

### Caso 1: Formato Actual (el que estamos usando)
```json
{
  "id": 69555614,
  "clientTxId": "2272b214251106-1301-1826"
}
```

### Caso 2: Solo Prefijo (8 caracteres)
```json
{
  "id": 69555614,
  "clientTxId": "2272b214"
}
```

### Caso 3: Prefijo + Fecha (sin hora ni random)
```json
{
  "id": 69555614,
  "clientTxId": "2272b214251106"
}
```

### Caso 4: Formato Similar al Ejemplo Exitoso
```json
{
  "id": 69555614,
  "clientTxId": "2272b214-1301-1826"
}
```

### Caso 5: OrderId Completo (UUID)
```json
{
  "id": 69555614,
  "clientTxId": "2272b214-fef6-4258-b04f-b0e7c5d409be"
}
```

### Caso 6: Formato Exacto del Ejemplo (BR231121-1142-0215)
```json
{
  "id": 69555614,
  "clientTxId": "BR231121-1142-0215"
}
```

## Qué Observar en la Respuesta

### Respuesta Exitosa (200 OK)
Deberías recibir un JSON como:
```json
{
  "email": "...",
  "cardType": "Credit",
  "statusCode": 3,
  "transactionStatus": "Approved",
  "authorizationCode": "...",
  "transactionId": 69555614,
  "clientTransactionId": "...",
  ...
}
```

### Respuesta con Error (500)
Recibirás HTML con "Runtime Error" - esto es lo que estamos viendo actualmente.

## Pasos en Postman

1. Abrir Postman
2. Crear nueva solicitud
3. Seleccionar método `POST`
4. Pegar URL: `https://pay.payphonetodoesposible.com/api/button/V2/Confirm`
5. Ir a la pestaña "Headers"
6. Agregar los 3 headers mencionados arriba
7. Ir a la pestaña "Body"
8. Seleccionar "raw" y "JSON"
9. Pegar el JSON del caso de prueba
10. Hacer clic en "Send"
11. Observar la respuesta

## Notas Importantes

- El `id` debe ser el número de transacción que Payphone generó (69555614 en este caso)
- El `clientTxId` debe ser el mismo que enviaste al crear la transacción
- El token debe ser el token completo (no truncado)
- El `Referer` debe ser la URL del callback donde Payphone redirigió

