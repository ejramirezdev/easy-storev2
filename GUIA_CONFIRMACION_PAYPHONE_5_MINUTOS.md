# Guía: Confirmación de Pagos Payphone dentro de 5 Minutos

## Resumen

Según la documentación de Payphone, **es crítico confirmar la recepción de un pago exitoso dentro de 5 minutos**, o Payphone revertirá automáticamente la transacción.

## Implementación Actual

### 1. Confirmación Automática (Callback)

El sistema confirma automáticamente cuando Payphone redirige al usuario después del pago exitoso:

- **Endpoint**: `/api/payphone/callback`
- **Cuándo se ejecuta**: Inmediatamente después de que el usuario completa el pago
- **Acción**: Confirma el pago con la API de Payphone y marca la orden como `PAID`

### 2. Confirmación de Respaldo (Backup)

Si el callback falla o no se ejecuta, existe un endpoint de respaldo:

- **Endpoint**: `/api/payphone/confirm-pending`
- **Cuándo ejecutar**: Cada 1-2 minutos (recomendado)
- **Acción**: Verifica órdenes con pagos iniciados hace menos de 5 minutos y los confirma automáticamente

## Configuración

### Variables de Entorno

Agregar a `.env`:

```env
# Secret key para proteger el endpoint de confirmación (opcional pero recomendado)
PAYPHONE_CONFIRM_SECRET=tu_secret_key_segura_aqui
```

### Configurar Cron Job

Para asegurar que los pagos se confirmen dentro de 5 minutos, configura un cron job que ejecute el endpoint cada 1-2 minutos:

#### Opción 1: Cron Job en Linux/Mac

```bash
# Ejecutar cada 2 minutos
*/2 * * * * curl -X GET "https://tu-dominio.com/api/payphone/confirm-pending?secret=tu_secret_key_segura_aqui"
```

#### Opción 2: Usando Vercel Cron Jobs

En `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/payphone/confirm-pending?secret=tu_secret_key_segura_aqui",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

#### Opción 3: Usando servicios externos

- **cron-job.org**: Configura una tarea que llame a tu endpoint cada 2 minutos
- **EasyCron**: Similar a cron-job.org
- **UptimeRobot**: Puede hacer pings HTTP cada 5 minutos

## Cómo Funciona

### Flujo Normal (Callback Exitoso)

1. Usuario completa el pago en Payphone
2. Payphone redirige a `/api/payphone/callback?id=XXX&clientTransactionId=YYY`
3. El callback:
   - Busca la orden por `clientTransactionId`
   - Confirma el pago con la API de Payphone
   - Marca la orden como `PAID`
   - Resta el stock
   - Limpia el carrito

### Flujo de Respaldo (Callback Fallido)

1. Usuario completa el pago en Payphone
2. El callback falla o no se ejecuta (usuario cierra navegador, error de red, etc.)
3. El cron job ejecuta `/api/payphone/confirm-pending` cada 2 minutos
4. El endpoint:
   - Busca órdenes con `payphonePaymentStartedAt` hace menos de 5 minutos
   - Verifica que tengan `payphoneTransactionId` (del callback)
   - Confirma el pago con la API de Payphone
   - Marca la orden como `PAID` si es exitoso

## Campos en Base de Datos

Se agregaron los siguientes campos al modelo `Order`:

- `payphoneTransactionId`: ID de transacción generado por Payphone (recibido en callback)
- `payphoneClientTransactionId`: ID único que enviamos a Payphone
- `payphonePaymentStartedAt`: Fecha/hora cuando se inició el pago
- `payphoneConfirmedAt`: Fecha/hora cuando se confirmó exitosamente

## Monitoreo

Para verificar que todo funciona correctamente:

1. **Revisar logs del servidor**: Busca mensajes que empiecen con "Payphone callback:" o "Payphone confirm-pending:"
2. **Verificar órdenes pendientes**: Revisa órdenes en estado `PENDING` con `payphonePaymentStartedAt` reciente
3. **Probar manualmente**: Puedes llamar al endpoint de confirmación manualmente:
   ```bash
   curl -X GET "https://tu-dominio.com/api/payphone/confirm-pending?secret=tu_secret_key"
   ```

## Troubleshooting

### Problema: Los pagos no se confirman automáticamente

**Solución**:

1. Verifica que el cron job esté configurado y funcionando
2. Revisa los logs del servidor para ver errores
3. Verifica que `PAYPHONE_CONFIRM_SECRET` esté configurado correctamente

### Problema: El callback no se ejecuta

**Posibles causas**:

1. La URL de callback en Payphone no está configurada correctamente
2. Problemas de red o firewall bloqueando el callback
3. El servidor está caído cuando Payphone intenta enviar el callback

**Solución**: El endpoint de confirmación de respaldo debería capturar estos casos.

### Problema: Pagos se revierten después de 5 minutos

**Causa**: No se confirmó el pago dentro de los 5 minutos.

**Solución**:

1. Verifica que el cron job esté ejecutándose
2. Revisa los logs para ver por qué falló la confirmación
3. Asegúrate de que el token de Payphone sea válido

## Notas Importantes

1. **No deshabilitar el cron job**: Es crítico para capturar casos donde el callback falla
2. **El secret key es opcional pero recomendado**: Protege el endpoint de llamadas no autorizadas
3. **El cron job procesa hasta 50 órdenes por ejecución**: Si tienes más, puede tomar múltiples ejecuciones
4. **El endpoint solo procesa órdenes con `payphoneTransactionId`**: Si el callback no llegó, no se puede confirmar (esto es normal, Payphone reversará si no se confirma)

## Seguridad

- El endpoint de confirmación requiere un `secret` en la URL para evitar llamadas no autorizadas
- Solo procesa órdenes con pagos iniciados hace menos de 5 minutos
- Solo confirma pagos que tienen un `payphoneTransactionId` (recibido del callback)
