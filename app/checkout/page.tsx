"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";

/* ---------- Esquemas ---------- */

// Tipo de identificación
const IdTypeSchema = z.enum(["CEDULA", "RUC"]);

// Helper de validación EC
function validateECId(type: "CEDULA" | "RUC", value: string) {
  const v = (value ?? "").trim();
  if (type === "CEDULA") {
    return /^\d{10}$/.test(v); // 10 dígitos
  }
  // RUC: 13 dígitos y termina en 001
  return /^\d{13}$/.test(v) && v.endsWith("001");
}

/** 1) Esquema base SIN efectos (para poder usar .partial() en billing) */
const BaseAddressSchema = z.object({
  firstName: z.string().trim().min(1, "Requerido"),
  lastName: z.string().trim().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  documentType: IdTypeSchema,
  documentId: z.string().trim().min(1, "Identificación requerida"),
  line1: z.string().trim().min(1, "Requerido"),
  line2: z.string().optional(),
  city: z.string().trim().min(1, "Requerido"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().trim().min(2, "Requerido").default("EC"),
});

/** 2) Esquema con efectos (validación Cédula/RUC) para shipping y (si aplica) billing */
const AddressSchema = BaseAddressSchema.superRefine((val, ctx) => {
  if (!validateECId(val.documentType, val.documentId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        val.documentType === "CEDULA"
          ? "Cédula inválida (10 dígitos numéricos)"
          : "RUC inválido (13 dígitos y debe terminar en 001)",
      path: ["documentId"],
    });
  }
});

/** 3) Form base: shipping con AddressSchema, billing como PARCIAL del *base* */
const BaseFormSchema = z.object({
  shipping: AddressSchema,
  billingSameAsShipping: z.boolean().default(true),
  billing: BaseAddressSchema.partial().optional(), // ✅ aquí sí podemos usar partial()
  notes: z.string().optional(),
});

/** Tipos para RHF/TS */
type Address = z.infer<typeof BaseAddressSchema>;
type FormValues = z.infer<typeof BaseFormSchema>;

/** 4) Form final con reglas condicionales (requeridos en billing si corresponde) */
const FormSchema = BaseFormSchema.superRefine((val, ctx) => {
  // Si billingSameAsShipping es true, NO validar billing en absoluto
  if (val.billingSameAsShipping) {
    return; // Salir temprano, no validar billing
  }
  
  // Solo validar billing si NO está marcado "usar mismos datos" Y billing existe
  if (val.billing) {
    const required: (keyof Address)[] = [
      "firstName",
      "lastName",
      "email",
      "documentType",
      "documentId",
      "line1",
      "city",
      // "country"  // no lo exigimos porque no hay input visible; seteamos "EC" por defecto
    ];

    for (const key of required) {
      const raw = (val.billing as any)?.[key];
      const ok =
        typeof raw === "string"
          ? raw.trim().length > 0
          : raw !== undefined && raw !== null;
      if (!ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Campo requerido",
          path: ["billing", key],
        });
      }
    }

    // Validación de identificación en billing (si está visible)
    const b = val.billing as Partial<Address> | undefined;
    if (b?.documentType && b?.documentId) {
      const valid =
        b.documentType === "CEDULA"
          ? /^\d{10}$/.test(b.documentId!)
          : /^\d{13}$/.test(b.documentId!) && b.documentId!.endsWith("001");
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            b.documentType === "CEDULA"
              ? "Cédula inválida (10 dígitos numéricos)"
              : "RUC inválido (13 dígitos y debe terminar en 001)",
          path: ["billing", "documentId"],
        });
      }
    }
  }
});

/* ---------- Componente ---------- */

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [summary, setSummary] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      shipping: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        documentType: "CEDULA",
        documentId: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "EC",
      },
      billingSameAsShipping: true,
      notes: "",
    },
  });

  const billingSameAsShipping = watch("billingSameAsShipping");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          ok: boolean;
          profile?: {
            firstName?: string;
            lastName?: string;
            email?: string;
            phone?: string;
            documentType?: string;
            documentId?: string;
            shippingLine1?: string;
            shippingLine2?: string;
            shippingCity?: string;
            shippingState?: string;
            shippingPostalCode?: string;
            shippingCountry?: string;
            billingFirstName?: string;
            billingLastName?: string;
            billingEmail?: string;
            billingPhone?: string;
            billingDocumentType?: string;
            billingDocumentId?: string;
            billingLine1?: string;
            billingLine2?: string;
            billingCity?: string;
            billingState?: string;
            billingPostalCode?: string;
            billingCountry?: string;
          };
        };
        if (!json.ok || !json.profile || !active) return;
        const profile = json.profile;
        const entries: [any, any][] = [
          ["shipping.firstName", profile.firstName ?? ""],
          ["shipping.lastName", profile.lastName ?? ""],
          ["shipping.email", profile.email ?? ""],
          ["shipping.phone", profile.phone ?? ""],
          ["shipping.documentType", profile.documentType ?? "CEDULA"],
          ["shipping.documentId", profile.documentId ?? ""],
          ["shipping.line1", profile.shippingLine1 ?? ""],
          ["shipping.line2", profile.shippingLine2 ?? ""],
          ["shipping.city", profile.shippingCity ?? ""],
          ["shipping.state", profile.shippingState ?? ""],
          ["shipping.postalCode", profile.shippingPostalCode ?? ""],
          ["shipping.country", profile.shippingCountry ?? "EC"],
        ];
        
        for (const [key, value] of entries) {
          setValue(key, value, { shouldValidate: false, shouldDirty: false });
        }
        
        // Si billingSameAsShipping está marcado (por defecto es true), limpiar billing
        // Esto asegura que no se validen campos de billing cuando el checkbox está marcado
        // El checkbox está marcado por defecto, así que siempre limpiamos billing al cargar
        setValue("billing", undefined, { shouldValidate: false, shouldDirty: false });
      } catch (err) {
        console.error("No se pudo precargar el perfil", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [setValue]);

  const goToSummary = () => {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch("/api/checkout/preview", { method: "GET" });
        const json = (await res.json()) as any;
        if (!res.ok || !json?.ok)
          throw new Error(json?.error || "No se pudo obtener el resumen");
        setSummary(json as PreviewResponse);
        setStep(2);
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  const createOrder = (data: FormValues) => {
    startTransition(async () => {
      setError(null);
      try {
        const payload = {
          shipping: data.shipping,
          billing: billingSameAsShipping
            ? { useShipping: true }
            : { country: "EC", ...(data.billing || {}) },
          notes: data.notes,
        };
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as {
          ok: boolean;
          orderId?: string;
          error?: string;
        };
        if (!res.ok || !json?.ok || !json.orderId)
          throw new Error(json?.error || "No se pudo crear la orden");
        router.push(`/orders/${json.orderId}`);
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  const onSubmit = (data: FormValues) => {
    if (step === 1) return goToSummary();
    if (step === 2) return createOrder(data);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Checkout
      </Typography>

      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form
          onSubmit={handleSubmit(onSubmit, () =>
            setError("Por favor completa los campos requeridos del formulario.")
          )}
          noValidate
        >
          {step === 1 && (
            <Stack spacing={3}>
              <Typography variant="h6">Datos de envío</Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nombre"
                    fullWidth
                    InputLabelProps={{ shrink: !!watch("shipping.firstName") }}
                    {...register("shipping.firstName")}
                    error={!!errors.shipping?.firstName}
                    helperText={errors.shipping?.firstName?.message}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Apellido"
                    fullWidth
                    InputLabelProps={{ shrink: !!watch("shipping.lastName") }}
                    {...register("shipping.lastName")}
                    error={!!errors.shipping?.lastName}
                    helperText={errors.shipping?.lastName?.message}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    fullWidth
                    InputLabelProps={{ shrink: !!watch("shipping.email") }}
                    {...register("shipping.email")}
                    error={!!errors.shipping?.email}
                    helperText={errors.shipping?.email?.message}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Teléfono"
                    fullWidth
                    InputLabelProps={{ shrink: !!watch("shipping.phone") }}
                    {...register("shipping.phone")}
                  />
                </Grid>

                {/* Tipo + Nº de identificación */}
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    SelectProps={{ native: true }}
                    label="Tipo identificación"
                    fullWidth
                    {...register("shipping.documentType")}
                    error={!!errors.shipping?.documentType}
                    helperText={errors.shipping?.documentType?.message}
                  >
                    <option value="CEDULA">Cédula</option>
                    <option value="RUC">RUC</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField
                    label="Número"
                    fullWidth
                    inputMode="numeric"
                    InputLabelProps={{ shrink: !!watch("shipping.documentId") }}
                    {...register("shipping.documentId")}
                    error={!!errors.shipping?.documentId}
                    helperText={errors.shipping?.documentId?.message}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Dirección"
                    fullWidth
                    InputLabelProps={{ shrink: !!watch("shipping.line1") }}
                    {...register("shipping.line1")}
                    error={!!errors.shipping?.line1}
                    helperText={errors.shipping?.line1?.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Referencia (opcional)"
                    fullWidth
                    InputLabelProps={{ shrink: !!watch("shipping.line2") }}
                    {...register("shipping.line2")}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Ciudad"
                    fullWidth
                    InputLabelProps={{ shrink: !!watch("shipping.city") }}
                    {...register("shipping.city")}
                    error={!!errors.shipping?.city}
                    helperText={errors.shipping?.city?.message}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Provincia/Estado"
                    fullWidth
                    InputLabelProps={{ shrink: !!watch("shipping.state") }}
                    {...register("shipping.state")}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Código Postal"
                    fullWidth
                    InputLabelProps={{ shrink: !!watch("shipping.postalCode") }}
                    {...register("shipping.postalCode")}
                  />
                </Grid>
              </Grid>

              <Divider />

              {/* Checkbox 100% controlado */}
              <Controller
                name="billingSameAsShipping"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setError(null);
                          field.onChange(checked);
                          if (checked) {
                            // Al marcar "usar misma dirección", limpiar todos los campos de billing
                            setValue("billing", undefined, {
                              shouldValidate: false,
                              shouldDirty: false,
                            });
                          } else {
                            // Al desmarcar, setear defaults útiles
                            setValue("billing.country", "EC", {
                              shouldValidate: false,
                            });
                            setValue("billing.documentType", "CEDULA", {
                              shouldValidate: false,
                            });
                          }
                        }}
                      />
                    }
                    label="Usar misma dirección para facturación"
                  />
                )}
              />

              {/* Si NO usa misma dirección, pedimos facturación */}
              {!billingSameAsShipping && (
                <Stack spacing={2}>
                  <Typography variant="h6">Datos de facturación</Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Nombre"
                        fullWidth
                        InputLabelProps={{ shrink: !!watch("billing.firstName") }}
                        {...register("billing.firstName")}
                        error={!!errors.billing?.firstName}
                        helperText={errors.billing?.firstName?.message}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Apellido"
                        fullWidth
                        InputLabelProps={{ shrink: !!watch("billing.lastName") }}
                        {...register("billing.lastName")}
                        error={!!errors.billing?.lastName}
                        helperText={errors.billing?.lastName?.message}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Email"
                        fullWidth
                        InputLabelProps={{ shrink: !!watch("billing.email") }}
                        {...register("billing.email")}
                        error={!!errors.billing?.email}
                        helperText={errors.billing?.email?.message}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Teléfono"
                        fullWidth
                        InputLabelProps={{ shrink: !!watch("billing.phone") }}
                        {...register("billing.phone")}
                      />
                    </Grid>

                    {/* Tipo + Nº de identificación (billing) */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        SelectProps={{ native: true }}
                        label="Tipo identificación"
                        fullWidth
                        {...register("billing.documentType")}
                        error={!!errors.billing?.documentType}
                        helperText={errors.billing?.documentType?.message}
                      >
                        <option value="CEDULA">Cédula</option>
                        <option value="RUC">RUC</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <TextField
                        label="Número"
                        fullWidth
                        inputMode="numeric"
                        InputLabelProps={{ shrink: !!watch("billing.documentId") }}
                        {...register("billing.documentId")}
                        error={!!errors.billing?.documentId}
                        helperText={errors.billing?.documentId?.message}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Dirección"
                        fullWidth
                        InputLabelProps={{ shrink: !!watch("billing.line1") }}
                        {...register("billing.line1")}
                        error={!!errors.billing?.line1}
                        helperText={errors.billing?.line1?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Referencia (opcional)"
                        fullWidth
                        InputLabelProps={{ shrink: !!watch("billing.line2") }}
                        {...register("billing.line2")}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Ciudad"
                        fullWidth
                        InputLabelProps={{ shrink: !!watch("billing.city") }}
                        {...register("billing.city")}
                        error={!!errors.billing?.city}
                        helperText={errors.billing?.city?.message}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Provincia/Estado"
                        fullWidth
                        InputLabelProps={{ shrink: !!watch("billing.state") }}
                        {...register("billing.state")}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Código Postal"
                        fullWidth
                        InputLabelProps={{ shrink: !!watch("billing.postalCode") }}
                        {...register("billing.postalCode")}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              )}

              <TextField
                label="Notas (opcional)"
                fullWidth
                multiline
                rows={3}
                InputLabelProps={{ shrink: !!watch("notes") }}
                {...register("notes")}
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isPending || isSubmitting}
                >
                  {isPending ? "Cargando..." : "Continuar con el resumen"}
                </Button>
              </Stack>
            </Stack>
          )}

          {step === 2 && summary && (
            <Stack spacing={3}>
              <Typography variant="h6">Resumen de compra</Typography>

              <Paper variant="outlined">
                <Box p={2}>
                  <Stack spacing={1}>
                    {summary.items.map((it) => (
                      <Stack
                        key={it.id}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body1">
                          {it.product.name} × {it.quantity}
                        </Typography>
                        <Typography variant="body2">
                          ${it.lineTotal.toFixed(2)}
                        </Typography>
                      </Stack>
                    ))}
                    <Divider sx={{ my: 1 }} />
                    <Row label="Subtotal" value={summary.subtotal} />
                    {summary.coupon && (
                      <Row
                        label={`Descuento (${summary.coupon.code})`}
                        value={-Math.abs(summary.discount)}
                      />
                    )}
                    {/* Impuesto oculto - ya está incluido en el precio */}
                    {summary.shipping > 0 && (
                      <Row label="Envío" value={summary.shipping} />
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Row label="Total" value={summary.total} strong />
                  </Stack>
                </Box>
              </Paper>

              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Button
                  variant="text"
                  onClick={() => {
                    setError(null);
                    setStep(1);
                  }}
                  disabled={isPending}
                >
                  Volver
                </Button>
                <Button variant="contained" type="submit" disabled={isPending}>
                  {isPending ? "Creando orden..." : "Confirmar y crear orden"}
                </Button>
              </Stack>
            </Stack>
          )}
        </form>
      </Paper>
    </Container>
  );
}

/* ---------- Tipos auxiliares API preview ---------- */
type PreviewItem = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    price: number;
  };
  lineTotal: number;
};
type PreviewResponse = {
  ok: true;
  items: PreviewItem[];
  coupon: { code: string; type: string; value: number } | null;
  subtotal: number;
  discount: number;
  tax: number; // Impuesto del 15%
  shipping: number;
  total: number;
};

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography
        variant={strong ? "subtitle1" : "body2"}
        fontWeight={strong ? 700 : 400}
      >
        {label}
      </Typography>
      <Typography
        variant={strong ? "subtitle1" : "body2"}
        fontWeight={strong ? 700 : 400}
      >
        ${value.toFixed(2)}
      </Typography>
    </Stack>
  );
}
