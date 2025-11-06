# Información para Soporte de Payphone - Error 500

## Endpoint
```
POST https://pay.payphonetodoesposible.com/api/button/V2/Confirm
```

## Headers Enviados
```
Content-Type: application/json
Authorization: Bearer vNrS9x0psd2pnrcW2p3KTtF7w-3-A9qQUbm638jGCIc_MVctDTN9bE_eZ9ky14aQa3z5VAXxUyEVDUWXTicV9W31FiXbibL1Hnx6W0P3tQBasElDhPkD0A8NzDAtQJMcXOuSqZn_hSlRnH2mfVVKvJTT3hE2mBXVwJFMG5GKTz1QnFDNZi5vnJBOZQ5g51glHF9v0I91r2jx8KnfL74piZJnyv7PioC45ND8XFpFoagAr6vYuev3p4SR983YmpGdPn4pC0e03ZZWsLSn6B3c2b1FVwa8zkHpF7B-MAlRUcrJT418Vw7A2WxOjD3ZF2gGUATc9w
Referer: http://localhost:3000/api/payphone/callback
```

**NOTA**: El token completo tiene 326 caracteres. Si el soporte necesita verificar el token, puede encontrarlo en la configuración de PayphoneSettings en la base de datos.

## JSON Payload Enviado
```json
{
  "id": 69555614,
  "clientTxId": "2272b214251106-1301-1826"
}
```

## Detalles de la Transacción

### ID de Transacción (id)
```
69555614
```

### Client Transaction ID (clientTxId)
```
2272b214251106-1301-1826
```

### Store ID
```
f075e630-9df3-4947-96b2-4e60564a47fc
```

### Order ID (nuestro ID interno)
```
2272b214-fef6-4258-b04f-b0e7c5d409be
```

## Respuesta Recibida

### Status Code
```
500 Internal Server Error
```

### Content-Type
```
text/html; charset=utf-8
```

### Respuesta (HTML Error)
```html
<!DOCTYPE html>
<html>
    <head>
        <title>Runtime Error</title>
        ...
    </head>
    <body bgcolor="white">
        <span><H1>Server Error in '/' Application.</H1>
        <h2> <i>Runtime Error</i> </h2></span>
        <font face="Arial, Helvetica, Geneva, SunSans-Regular, sans-serif ">
        <b> Description: </b>An exception occurred while processing your request. Additionally, another exception occurred while executing the custom error page for the first exception. The request has been terminated.
        </font>
    </body>
</html>
```

## Información Adicional

### Timestamp del Error
```
2025-11-06T18:01:59.573Z
```

### URL del Callback
```
http://localhost:3000/api/payphone/callback?id=69555614&clientTransactionId=2272b214251106-1301-1826
```

### Ambiente
```
sandbox
```

## Formatos Alternativos Probados (todos fallaron con 500)

1. **Solo prefijo (8 caracteres)**
   ```json
   {
     "id": 69555614,
     "clientTxId": "2272b214"
   }
   ```

2. **Prefijo + primera parte**
   ```json
   {
     "id": 69555614,
     "clientTxId": "2272b214251106"
   }
   ```

3. **Prefijo + fecha + hora (sin random)**
   ```json
   {
     "id": 69555614,
     "clientTxId": "2272b2141301-1826"
   }
   ```

4. **OrderId completo (UUID)**
   ```json
   {
     "id": 69555614,
     "clientTxId": "2272b214-fef6-4258-b04f-b0e7c5d409be"
   }
   ```

## Notas Importantes

- El pago fue procesado exitosamente por Payphone (recibimos email de confirmación)
- El problema es específicamente con el endpoint de confirmación `/api/button/V2/Confirm`
- Todos los formatos de `clientTxId` probados resultan en el mismo error 500
- El token tiene 326 caracteres de longitud
- El `clientTransactionId` tiene 24 caracteres de longitud

## Preguntas para Soporte

1. ¿El formato del `clientTxId` es correcto?
2. ¿El `id` (69555614) corresponde a una transacción válida?
3. ¿El token tiene los permisos necesarios para confirmar transacciones?
4. ¿Hay algún problema conocido con el endpoint `/api/button/V2/Confirm`?
5. ¿El header `Referer` es necesario o puede causar problemas?
6. ¿Hay algún formato específico requerido para el `clientTxId`?

