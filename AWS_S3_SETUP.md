# Configuración de AWS S3 para Easy Store

## 📋 Resumen

Este proyecto ahora utiliza AWS S3 para almacenar:
- Imágenes de productos (principal + galería)
- Comprobantes de transferencia bancaria

## 🚀 Paso 1: Crear Bucket en AWS

### 1.1 Crear el Bucket

1. Inicia sesión en [AWS Console](https://console.aws.amazon.com/)
2. Busca "S3" en el buscador superior
3. Click en "Crear bucket"
4. Configuración:
   - **Nombre del bucket**: `easy-store-ecu-files` (debe ser único globalmente, ajusta si es necesario)
   - **Región de AWS**: `us-east-1` (o la que prefieras)
   - **Bloqueo de acceso público**: ⚠️ **DESMARCAR** "Bloquear todo el acceso público"
   - Aceptar la advertencia que aparece
5. Click en "Crear bucket"

### 1.2 Configurar Permisos del Bucket

1. Entra al bucket creado
2. Ve a la pestaña **"Permisos"**
3. En **"Política de bucket"**, click en "Editar" y pega esta política (reemplaza `easy-store-ecu-files` con tu nombre de bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::easy-store-ecu-files/*"
    }
  ]
}
```

4. Guarda los cambios

### 1.3 Configurar CORS

1. En la misma pestaña **"Permisos"**
2. Scroll hasta **"Uso compartido de recursos entre orígenes (CORS)"**
3. Click en "Editar" y pega esta configuración:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

4. Guarda los cambios

## 👤 Paso 2: Crear Usuario IAM

### 2.1 Crear el Usuario

1. En AWS Console, busca **"IAM"**
2. Click en **"Usuarios"** → **"Crear usuario"**
3. Nombre del usuario: `easy-store-uploader`
4. Click en "Siguiente"

### 2.2 Asignar Permisos

1. Selecciona **"Asociar políticas directamente"**
2. Busca y selecciona: **`AmazonS3FullAccess`**
3. Click en "Siguiente" y luego "Crear usuario"

### 2.3 Crear Clave de Acceso

1. Entra al usuario recién creado
2. Ve a la pestaña **"Credenciales de seguridad"**
3. Click en **"Crear clave de acceso"**
4. Selecciona **"Aplicación que se ejecuta fuera de AWS"**
5. Click en "Siguiente" y luego "Crear clave de acceso"
6. ⚠️ **IMPORTANTE**: Copia y guarda:
   - **Access Key ID**
   - **Secret Access Key**
   
   (No podrás ver el Secret Access Key después)

## ⚙️ Paso 3: Configurar Variables de Entorno

Crea o edita tu archivo `.env.local` en la raíz del proyecto:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu-access-key-id-aqui
AWS_SECRET_ACCESS_KEY=tu-secret-access-key-aqui
AWS_S3_BUCKET_NAME=easy-store-ecu-files
AWS_S3_BUCKET_URL=https://easy-store-ecu-files.s3.us-east-1.amazonaws.com
```

**Notas:**
- Reemplaza los valores con tus credenciales reales
- Si usaste otra región, ajusta `AWS_REGION` y `AWS_S3_BUCKET_URL`
- El formato de la URL es: `https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com`

## 🔄 Paso 4: Migrar Imágenes Existentes

Si ya tienes productos con imágenes en URLs externas, puedes migrarlas a S3:

```bash
# Ver qué se migraría (simulación)
npx tsx scripts/migrate-images-to-s3.ts --dry-run

# Ejecutar la migración real
npx tsx scripts/migrate-images-to-s3.ts

# Migrar solo un producto específico
npx tsx scripts/migrate-images-to-s3.ts --product=PRODUCT_ID
```

El script:
- ✅ Descarga cada imagen externa
- ✅ Valida que sea JPG o PNG
- ✅ Sube a S3
- ✅ Actualiza la base de datos
- ✅ Mantiene las imágenes que ya están en S3
- ✅ Muestra un reporte detallado

## 📝 Uso en el Panel Admin

### Crear/Editar Productos

#### Imagen Principal

1. Ve al panel admin → Productos
2. Al crear o editar un producto, verás un toggle:
   - **URL**: Pegar URL de imagen externa
   - **Subir**: Subir archivo desde tu PC

#### Galería de Imágenes

Tienes dos opciones:

1. **Agregar por URL**: Click en "Agregar por URL" para pegar una URL
2. **Subir archivos**: 
   - Arrastra y suelta imágenes en la zona de upload
   - O click para seleccionar archivos
   - Puedes subir múltiples imágenes a la vez
   - Solo JPG y PNG, máximo 5MB cada una

### Comprobantes de Transferencia

Los comprobantes bancarios ahora se suben automáticamente a S3 cuando los clientes realizan pagos por transferencia. Las URLs se guardan en la base de datos y se envían por email al administrador.

## 🗂️ Estructura en S3

```
easy-store-ecu-files/
├── products/
│   ├── product-123-1699999999999-abc123.jpg
│   ├── product-123-1699999999999-def456.png
│   └── ...
└── receipts/
    ├── receipt-order-456-1699999999999.jpg
    └── ...
```

## 🔒 Seguridad

- ✅ Las credenciales AWS están en variables de entorno (nunca en el código)
- ✅ Solo los admins pueden subir imágenes de productos
- ✅ Validación de tipos de archivo en backend
- ✅ Límite de tamaño: 5MB por archivo
- ✅ El bucket es público solo para lectura (GetObject)
- ✅ Escritura requiere credenciales (autenticación)

## ❓ Solución de Problemas

### Error: "AWS_S3_BUCKET_NAME no está configurado"

Asegúrate de que `.env.local` existe y tiene todas las variables.

### Error: "Access Denied" al subir archivos

1. Verifica que las credenciales AWS sean correctas
2. Verifica que el usuario IAM tenga la política `AmazonS3FullAccess`
3. Verifica el nombre del bucket en las variables de entorno

### Las imágenes no se ven en el sitio

1. Verifica que la política del bucket permita lectura pública
2. Verifica que la URL en `AWS_S3_BUCKET_URL` sea correcta
3. Intenta abrir la URL de una imagen directamente en el navegador

### Error en el script de migración

- Asegúrate de que las variables de entorno estén configuradas
- Ejecuta primero con `--dry-run` para ver qué pasaría
- Revisa el reporte de errores al final de la ejecución

## 📊 Monitoreo de Costos

AWS S3 tiene costos por:
- **Almacenamiento**: ~$0.023 por GB/mes (us-east-1)
- **Transferencia de datos**: Primeros 100 GB/mes gratis, luego ~$0.09 por GB
- **Solicitudes**: PUT/POST ~$0.005 por 1,000 solicitudes, GET ~$0.0004 por 1,000 solicitudes

Para un e-commerce pequeño-mediano, los costos suelen ser de **$1-10 USD/mes**.

Puedes monitorear costos en: AWS Console → Billing → Cost Explorer

## 🆘 Soporte

Si tienes problemas:
1. Verifica que todos los pasos de configuración estén completos
2. Revisa los logs de la consola del navegador o terminal
3. Verifica las credenciales AWS en `.env.local`
4. Asegúrate de haber reiniciado el servidor después de configurar las variables de entorno

## ✅ Checklist de Configuración

- [ ] Bucket de S3 creado
- [ ] Política de bucket configurada (acceso público de lectura)
- [ ] CORS configurado en el bucket
- [ ] Usuario IAM creado con política S3FullAccess
- [ ] Clave de acceso generada y guardada
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Servidor reiniciado
- [ ] (Opcional) Imágenes existentes migradas a S3
- [ ] Probado subir imagen desde panel admin
- [ ] Probado subir comprobante bancario

---

**¡Listo!** Tu sistema ahora está configurado para usar AWS S3 para almacenar archivos de forma profesional y escalable. 🎉

