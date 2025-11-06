# Flujo de Confirmación de Pagos Payphone

## ¿Cómo funciona la confirmación?

Tienes razón en tu pregunta. El endpoint `/api/button/V2/Confirm` **NO es para recibir la confirmación de Payphone**, sino para **NOSOTROS confirmarle a Payphone** que recibimos su notificación de pago exitoso.

## Flujo Completo

### 1. Usuario Realiza el Pago

- El usuario completa el pago en Payphone
- Payphone procesa el pago exitosamente

### 2. Payphone Envía Notificación (Callback)

- Payphone redirige al usuario a nuestro callback: `/api/payphone/callback?id=XXX&clientTransactionId=YYY`
- Esto es una **notificación** de Payphone diciéndonos "hey, este pago fue exitoso"
- **Pero esto NO confirma automáticamente el pago**

### 3. Nosotros Confirmamos a Payphone (Crítico ⚠️)

- En nuestro callback, **NOSOTROS** llamamos a `/api/button/V2/Confirm`
- Le decimos a Payphone: "Sí, recibí tu notificación, confirmo que el pago es válido"
- Payphone nos responde con los detalles de la transacción
- **Si NO hacemos esto en 5 minutos, Payphone revierte el pago automáticamente**

### 4. Payphone Respuesta

- Payphone nos responde con el estado de la transacción:
  ```json
  {
    "statusCode": 3, // 3 = Approved
    "transactionStatus": "Approved",
    "transactionId": "...",
    "authorizationCode": "..."
  }
  ```

## Endpoint de Confirmación

**Endpoint:** `POST https://pay.payphonetodoesposible.com/api/button/V2/Confirm`

**Headers:**

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <tu_token>"
}
```

**Payload (lo que enviamos a Payphone):**

```json
{
  "id": 12345, // ID que recibimos en el callback
  "clientTxId": "tu-client-transaction-id" // El ID que enviamos originalmente
}
```

**Respuesta (lo que Payphone nos confirma):**

```json
{
  "statusCode": 3,
  "transactionStatus": "Approved",
  "transactionId": "...",
  "authorizationCode": "...",
  "amount": 10000,
  "currency": "USD"
}
```

## Resumen

- **Callback de Payphone** = Payphone nos NOTIFICA que hubo un pago
- **Nuestra llamada a `/api/button/V2/Confirm`** = NOSOTROS CONFIRMAMOS a Payphone que recibimos la notificación
- **Si no confirmamos en 5 minutos** = Payphone revierte el pago automáticamente

## Nuestra Implementación

✅ **Está correcta**: Cuando recibimos el callback de Payphone, inmediatamente llamamos a `/api/button/V2/Confirm` para confirmar que recibimos la notificación.

✅ **Tenemos respaldo**: Si el callback falla, nuestro endpoint `/api/payphone/confirm-pending` verifica pagos pendientes y los confirma.

## Pregunta Clave

**¿Necesitamos otro endpoint además de `/api/button/V2/Confirm`?**

**Respuesta:** No. El endpoint `/api/button/V2/Confirm` es exactamente para confirmar a Payphone que recibimos su notificación. No hay otro endpoint necesario.

## Diagrama de Flujo

```
Usuario paga en Payphone
    ↓
Payphone procesa pago exitosamente
    ↓
Payphone redirige a nuestro callback
    ↓
NOSOTROS llamamos a /api/button/V2/Confirm
    ↓
Le confirmamos a Payphone: "Sí, recibí tu notificación"
    ↓
Payphone responde: "Ok, transacción confirmada, no la revertiremos"
    ↓
Marcamos orden como PAID
```

Si **NO** llamamos a `/api/button/V2/Confirm` dentro de 5 minutos:

```
Payphone espera 5 minutos...
    ↓
No recibió nuestra confirmación
    ↓
Payphone revierte el pago automáticamente
```
