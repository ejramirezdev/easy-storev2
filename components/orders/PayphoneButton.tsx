"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  AlertColor,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Snackbar,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { refreshCartGlobally } from "@/lib/useCart";

type Environment = "sandbox" | "production";

// URLs correctas del SDK de Payphone según la documentación oficial
const PAYPHONE_CSS_URL =
  "https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.css";
const PAYPHONE_JS_URL =
  "https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js";

export type PayphoneAddress = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  documentType?: string | null;
  document?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country: string;
};

export type PayphoneConfig = {
  environment: Environment;
  token: string;
  storeId: string;
  merchantName?: string | null;
  merchantEmail?: string | null;
  responseUrl: string;
  currency?: string;
};

type Totals = {
  subtotal: number;
  discount: number;
  tax?: number; // Impuesto del 15% (opcional para compatibilidad)
  shipping: number;
  total: number;
  currency?: string;
};

export type PayphoneButtonProps = {
  orderId: string;
  totals: Totals;
  billingAddress: PayphoneAddress | null;
  shippingAddress: PayphoneAddress | null;
  payphoneConfig: PayphoneConfig;
};

// Declarar el tipo global para PPaymentButtonBox
declare global {
  interface Window {
    PPaymentButtonBox?: new (config: PPaymentButtonBoxConfig) => {
      render: (containerId: string) => void;
    };
  }
}

type PPaymentButtonBoxConfig = {
  token: string;
  clientTransactionId: string;
  amount: number; // Valor total en centavos
  amountWithoutTax?: number; // Monto sin impuestos en centavos (opcional cuando usamos amountWithTax + tax)
  amountWithTax?: number; // Monto con impuestos en centavos
  tax?: number; // Valor del impuesto en centavos
  service?: number; // Valor del servicio en centavos
  tip?: number; // Propina en centavos
  currency: string; // Moneda (USD, etc.)
  storeId: string;
  reference: string; // Descripción o referencia
  lang?: string; // Idioma: "es" o "en"
  defaultMethod?: string; // "card" o "payphone"
  timeZone?: number; // Zona horaria
  lat?: string; // Latitud
  lng?: string; // Longitud
  optionalParameter?: string; // Parámetro opcional
  phoneNumber?: string; // Número de teléfono del titular
  email?: string; // Email del titular
  documentId?: string; // Número de identificación
  identificationType?: number; // 1=Cédula, 2=RUC, 3=Pasaporte
  backgroundColor?: string; // Color de fondo del botón
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: AlertColor;
};

export default function PayphoneButton({
  orderId,
  totals,
  billingAddress,
  shippingAddress,
  payphoneConfig,
}: PayphoneButtonProps) {
  const router = useRouter();
  const [cssLoaded, setCssLoaded] = useState(false);
  const [jsLoaded, setJsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const paymentBoxRef = useRef<any>(null);
  const containerId = `pp-button-${orderId}`;

  const currency = (
    totals.currency ||
    payphoneConfig.currency ||
    "USD"
  ).toUpperCase();

  // Convertir montos a centavos (Payphone requiere montos en centavos)
  const amountInCents = useMemo(() => {
    const total = Number.isFinite(totals.total) ? totals.total : 0;
    return Math.round(total * 100);
  }, [totals.total]);

  const subtotalInCents = useMemo(() => {
    const subtotal = Number.isFinite(totals.subtotal) ? totals.subtotal : 0;
    return Math.round(subtotal * 100);
  }, [totals.subtotal]);

  // Calcular impuestos: el precio ya incluye IVA, así que calculamos el impuesto desde el precio final
  // Si el precio es $100 con 15% IVA incluido:
  // - Precio base = $100 / 1.15 ≈ $86.96
  // - Impuesto = $100 - $86.96 ≈ $13.04
  const taxInCents = useMemo(() => {
    // El subtotal ya incluye el 15% de IVA
    // Calculamos el precio base sin IVA y luego el impuesto
    const subtotalAfterDiscount = Math.max(0, subtotalInCents - Math.round((totals.discount || 0) * 100));
    const basePrice = Math.round(subtotalAfterDiscount / 1.15); // Precio base sin IVA
    const tax = subtotalAfterDiscount - basePrice; // Impuesto incluido en el precio
    return tax;
  }, [subtotalInCents, totals.discount]);

  const serviceInCents = 0;
  const tipInCents = 0;

  const reference = useMemo(() => {
    return `Orden ${orderId}`;
  }, [orderId]);

  // Función para generar un clientTransactionId único para cada intento de pago
  // Formato basado en el ejemplo exitoso de Payphone: [PREFIJO][FECHA]-[HORA]-[RANDOM]
  // Ejemplo exitoso: "BR231121-1142-0215" (18 caracteres)
  // Esto permite reintentos seguros sin duplicar transacciones
  const generateClientTransactionId = useCallback(() => {
    // Usar los primeros 8 caracteres del orderId como prefijo (sin guiones del UUID)
    const orderIdShort = orderId.replace(/-/g, '').substring(0, 8);
    
    // Fecha: YYMMDD (6 dígitos) - similar al ejemplo "231121"
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const date = `${year}${month}${day}`;
    
    // Hora: HHMM (4 dígitos) - similar al ejemplo "1142"
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}${minutes}`;
    
    // Random: 4 dígitos alfanuméricos - similar al ejemplo "0215"
    const random = Math.random().toString(36).substring(2, 6).padStart(4, '0');
    
    // Formato: [PREFIJO][FECHA]-[HORA]-[RANDOM]
    // Ejemplo: "5daff9f6231121-1142-0215" = 22 caracteres (dentro del límite de 50)
    const clientTxId = `${orderIdShort}${date}-${time}-${random}`;
    
    // Validar que no exceda 50 caracteres (seguridad adicional)
    if (clientTxId.length > 50) {
      console.warn("Payphone: clientTransactionId excede 50 caracteres, truncando:", clientTxId);
      return clientTxId.substring(0, 50);
    }
    
    console.log("Payphone: clientTransactionId generado:", clientTxId, "longitud:", clientTxId.length);
    
    return clientTxId;
  }, [orderId]);

  const closeSnackbar = useCallback(() => setSnackbar(null), []);

  // Cargar CSS en el head
  useEffect(() => {
    if (document.getElementById("payphone-css")) {
      setCssLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = PAYPHONE_CSS_URL;
    link.id = "payphone-css";
    link.onload = () => {
      console.log("Payphone: CSS cargado desde:", PAYPHONE_CSS_URL);
      setCssLoaded(true);
    };
    link.onerror = () => {
      console.error("Payphone: Error cargando CSS");
      setCssLoaded(true); // Continuar sin CSS
    };
    document.head.appendChild(link);
  }, []);

  // Cargar el script como módulo ES6
  useEffect(() => {
    if (document.getElementById("payphone-sdk-module")) {
      setJsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = PAYPHONE_JS_URL;
    script.id = "payphone-sdk-module";
    script.async = true;

    script.onload = () => {
      console.log(
        "Payphone: Script módulo cargado exitosamente desde:",
        PAYPHONE_JS_URL
      );
      // Dar tiempo para que el módulo ES6 se inicialice completamente
      setTimeout(() => {
        console.log("Payphone: Marcando script como cargado después de delay");
        setJsLoaded(true);
      }, 1000);
    };

    script.onerror = () => {
      console.error("Payphone: Error cargando script");
      setError(
        "No se pudo cargar el SDK de Payphone. Verifica tu conexión a internet."
      );
      setJsLoaded(true); // Marcar como cargado para no bloquear indefinidamente
    };

    document.head.appendChild(script);
  }, []);

  const ready = cssLoaded && jsLoaded;

  // Función para inicializar la cajita de pagos
  const initializePaymentBox = useCallback(async () => {
    if (!ready || !payphoneConfig.token || !payphoneConfig.storeId) {
      console.warn("Payphone: No está listo para inicializar");
      return;
    }

    // Verificar que PPaymentButtonBox esté disponible
    if (!window.PPaymentButtonBox) {
      console.error("Payphone: PPaymentButtonBox no está disponible");
      setError(
        "El SDK de Payphone no se cargó correctamente. Por favor, recarga la página."
      );
      return;
    }

    // Generar un nuevo clientTransactionId único para este intento
    const currentClientTransactionId = generateClientTransactionId();
    console.log("Payphone: Generando nuevo clientTransactionId:", currentClientTransactionId);

    try {
      // Obtener datos del cliente desde billingAddress o shippingAddress
      const customerAddress = billingAddress || shippingAddress;
      const customerEmail = customerAddress?.email || "";

      // Formatear teléfono: debe incluir código de país con +
      // Formato requerido: +[código país][número]
      // Ejemplo Ecuador: +593978968926
      let customerPhone: string | undefined = undefined;
      if (customerAddress?.phone) {
        let phone = customerAddress.phone.trim();
        
        // Remover espacios y caracteres especiales excepto +
        phone = phone.replace(/[\s\-\(\)]/g, "");
        
        // Si ya tiene +, verificar que tenga código de país válido
        if (phone.startsWith("+")) {
          // Verificar que tenga al menos código de país (2-3 dígitos) + número
          const withoutPlus = phone.substring(1);
          if (withoutPlus.length >= 10) {
            customerPhone = phone;
          } else {
            // Si es muy corto, probablemente falta código de país
            // Asumir Ecuador (593) si el país es EC o no está especificado
            const country = customerAddress?.country || "EC";
            if (country === "EC" && withoutPlus.length >= 9) {
              customerPhone = `+593${withoutPlus}`;
            } else {
              // Si no podemos determinar, no enviar el teléfono
              console.warn("Payphone: Teléfono con formato inválido, no se enviará:", phone);
              customerPhone = undefined;
            }
          }
        } else {
          // No tiene +, agregar código de país según el país de la dirección
          const country = customerAddress?.country || "EC";
          const phoneDigits = phone.replace(/\D/g, "");
          
          if (country === "EC" && phoneDigits.length >= 9) {
            // Ecuador: código 593
            customerPhone = `+593${phoneDigits}`;
          } else if (phoneDigits.length >= 10) {
            // Otros países: asumir que ya tiene código de país
            customerPhone = `+${phoneDigits}`;
          } else {
            console.warn("Payphone: Teléfono muy corto, no se enviará:", phone);
            customerPhone = undefined;
          }
        }
      }

      const customerDocument = customerAddress?.document || undefined;
      const identificationType =
        customerAddress?.documentType === "RUC"
          ? 2
          : customerAddress?.documentType === "PASSPORT"
          ? 3
          : 1; // Por defecto Cédula

      console.log("Payphone: Datos del cliente", {
        email: customerEmail,
        phone: customerPhone,
        document: customerDocument,
        identificationType,
      });

      // Limpiar el contenedor antes de renderizar
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = "";
      }

      // Calcular amount correctamente según la documentación
      // El precio ya incluye IVA, así que:
      // - amountWithTax = precio base sin IVA (subtotal / 1.15)
      // - tax = impuesto calculado desde el precio que ya incluye IVA
      // - amount = subtotal + shipping + service + tip (el total que el usuario paga)
      const subtotalAfterDiscount = Math.max(0, subtotalInCents - Math.round((totals.discount || 0) * 100));
      const basePriceInCents = Math.round(subtotalAfterDiscount / 1.15); // Precio base sin IVA
      const shippingInCents = Math.round((totals.shipping || 0) * 100);
      const calculatedAmount = subtotalInCents + serviceInCents + tipInCents + shippingInCents;
      
      console.log("Payphone: Cálculos de montos (precio ya incluye IVA)", {
        subtotalInCents,
        subtotalAfterDiscount,
        basePriceInCents,
        taxInCents,
        taxPercentage: subtotalAfterDiscount > 0 ? ((taxInCents / subtotalAfterDiscount) * 100).toFixed(2) + "%" : "0%",
        serviceInCents,
        tipInCents,
        shippingInCents,
        calculatedAmount,
        amountInCents,
        diferencia: Math.abs(calculatedAmount - amountInCents),
      });
      
      // Usar el calculatedAmount que incluye shipping correctamente
      // El amountInCents viene de totals.total que ya debería incluir shipping
      // pero usamos calculatedAmount para estar seguros de que incluye todo
      const finalAmount = calculatedAmount;
      
      // Verificar que el amount calculado coincida con el total
      if (Math.abs(calculatedAmount - amountInCents) > 1) {
        console.warn(
          "Payphone: Discrepancia en cálculos de amount. Usando calculatedAmount que incluye shipping.",
          {
            calculatedAmount,
            amountInCents,
            subtotalInCents,
            taxInCents,
            serviceInCents,
            tipInCents,
            shippingInCents,
          }
        );
      }

      // Crear instancia de PPaymentButtonBox según la documentación
      // IMPORTANTE: El precio ya incluye IVA, así que calculamos:
      // - amountWithTax = precio base sin IVA (subtotal / 1.15)
      // - tax = impuesto calculado desde el precio que ya incluye IVA
      // - amount = total que el usuario paga (subtotal + shipping + service + tip)
      const config: PPaymentButtonBoxConfig = {
        token: payphoneConfig.token,
        clientTransactionId: currentClientTransactionId, // ID único para este intento de pago
        amount: finalAmount, // Total que el usuario paga (incluye subtotal + shipping + service + tip)
        amountWithTax: basePriceInCents, // Precio base sin IVA (sobre el cual se calcula el impuesto)
        // NO enviar amountWithoutTax cuando usamos amountWithTax + tax
        tax: taxInCents, // Impuesto calculado desde el precio que ya incluye IVA
        service: serviceInCents,
        tip: tipInCents,
        currency: currency,
        // Nota: Payphone no tiene un campo separado para "shipping" en el config
        // El shipping ya está incluido en el campo "amount" (calculatedAmount)
        storeId: payphoneConfig.storeId,
        reference: reference,
        lang: "es",
        defaultMethod: "card",
        timeZone: -5, // Ajustar según tu zona horaria
        ...(customerEmail && { email: customerEmail }),
        ...(customerPhone && { phoneNumber: customerPhone }),
        ...(customerDocument && { documentId: customerDocument }),
        ...(customerDocument && { identificationType }),
      };

      console.log(
        "Payphone: Inicializando PPaymentButtonBox con config:",
        config
      );
      console.log(
        "Payphone: Verificando configuración:",
        {
          clientTransactionId: currentClientTransactionId,
          tieneAmountWithTax: 'amountWithTax' in config,
          tieneTax: 'tax' in config,
          tieneAmountWithoutTax: 'amountWithoutTax' in config,
        }
      );

      // Guardar el clientTransactionId cuando se inicia el pago
      // Esto permite rastrear y confirmar el pago dentro de 5 minutos
      try {
        await fetch(`/api/orders/${orderId}/payphone/start-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientTransactionId: currentClientTransactionId,
          }),
        });
        console.log("Payphone: clientTransactionId guardado para confirmación");
      } catch (err) {
        console.error("Payphone: Error guardando clientTransactionId:", err);
        // No bloquear el flujo si falla, pero registrar el error
      }

      paymentBoxRef.current = new window.PPaymentButtonBox(config);
      paymentBoxRef.current.render(containerId);

      console.log("Payphone: Cajita de pagos renderizada exitosamente");
      setIsInitializing(false);
      setError(null);
    } catch (err: any) {
      console.error("Payphone: Error inicializando cajita de pagos:", err);
      setError(
        `Error al inicializar el formulario de pago: ${
          err?.message || "Error desconocido"
        }`
      );
      setIsInitializing(false);
    }
  }, [
    ready,
    payphoneConfig.token,
    payphoneConfig.storeId,
    amountInCents,
    subtotalInCents,
    taxInCents,
    serviceInCents,
    tipInCents,
    currency,
    orderId,
    reference,
    containerId,
    billingAddress,
    shippingAddress,
  ]);

  // Verificar que PPaymentButtonBox esté disponible
  useEffect(() => {
    if (!jsLoaded) return;

    let attempts = 0;
    const maxAttempts = 20;
    const checkInterval = 200;

    const checkSDK = () => {
      attempts++;
      if (window.PPaymentButtonBox) {
        console.log("Payphone: PPaymentButtonBox está disponible");
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(checkSDK, checkInterval);
      } else {
        console.warn(
          "Payphone: PPaymentButtonBox no se detectó después de varios intentos"
        );
      }
    };

    checkSDK();
  }, [jsLoaded]);

  // Manejar apertura del modal
  const handleOpenModal = useCallback(() => {
    if (!ready) {
      setError(
        "El SDK de Payphone aún se está cargando. Por favor, espera un momento."
      );
      return;
    }

    if (!payphoneConfig.token || !payphoneConfig.storeId) {
      setError("La configuración de Payphone no está completa.");
      return;
    }

    // Verificar que PPaymentButtonBox esté disponible antes de abrir el modal
    if (!window.PPaymentButtonBox) {
      setError(
        "El SDK de Payphone no se cargó correctamente. Por favor, recarga la página."
      );
      return;
    }

    setModalOpen(true);
    setIsInitializing(true);
    setError(null);

    // Esperar un momento para que el modal se renderice antes de inicializar
    setTimeout(async () => {
      await initializePaymentBox();
    }, 100);
  }, [
    ready,
    payphoneConfig.token,
    payphoneConfig.storeId,
    initializePaymentBox,
    generateClientTransactionId,
  ]);

  // Manejar cierre del modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    // Limpiar el contenedor cuando se cierra el modal
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = "";
    }
    paymentBoxRef.current = null;
    setIsInitializing(false);
  }, [containerId]);

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={!ready || isProcessing}
        onClick={handleOpenModal}
        startIcon={
          isProcessing ? (
            <CircularProgress color="inherit" size={18} />
          ) : undefined
        }
        sx={{ mt: 2 }}
      >
        {isProcessing ? "Procesando pago..." : "Pagar ahora"}
      </Button>

      {!ready && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Cargando pasarela de pagos...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Modal para la cajita de pagos */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "90vh",
          },
        }}
      >
        <DialogContent sx={{ p: 3, position: "relative" }}>
          <IconButton
            aria-label="cerrar"
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Realizar Pago
          </Typography>

          {isInitializing && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "200px",
                gap: 2,
              }}
            >
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Inicializando formulario de pago...
              </Typography>
            </Box>
          )}

          {/* Contenedor donde se renderizará la cajita de pagos */}
          <Box
            id={containerId}
            sx={{
              minHeight: isInitializing ? "200px" : "auto",
              "& > *": {
                width: "100%",
              },
            }}
          />
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!snackbar?.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snackbar ? (
          <Alert
            onClose={closeSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
}
