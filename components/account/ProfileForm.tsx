"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import GridLegacy from "@mui/material/GridLegacy";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: string;
  documentId: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingPhone: string;
  billingDocumentType: string;
  billingDocumentId: string;
  billingLine1: string;
  billingLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
};

const schema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email({ message: "Email inválido" }).optional(),
  phone: z.string().optional(),
  documentType: z.string().optional(),
  documentId: z.string().optional(),
  shippingLine1: z.string().optional(),
  shippingLine2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingEmail: z.string().email({ message: "Email inválido" }).optional(),
  billingPhone: z.string().optional(),
  billingDocumentType: z.string().optional(),
  billingDocumentId: z.string().optional(),
  billingLine1: z.string().optional(),
  billingLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
});

export default function ProfileForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      documentType: "CEDULA",
      documentId: "",
      shippingLine1: "",
      shippingLine2: "",
      shippingCity: "",
      shippingState: "",
      shippingPostalCode: "",
      shippingCountry: "EC",
      billingFirstName: "",
      billingLastName: "",
      billingEmail: "",
      billingPhone: "",
      billingDocumentType: "CEDULA",
      billingDocumentId: "",
      billingLine1: "",
      billingLine2: "",
      billingCity: "",
      billingState: "",
      billingPostalCode: "",
      billingCountry: "EC",
    },
  });

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("No se pudo cargar tu perfil");
        }
        const json = (await res.json()) as { ok: boolean; profile: Partial<FormValues> };
        if (json.ok && json.profile) {
          reset({
            ...json.profile,
            documentType: json.profile.documentType ?? "CEDULA",
            billingDocumentType: json.profile.billingDocumentType ?? "CEDULA",
            shippingCountry: json.profile.shippingCountry ?? "EC",
            billingCountry: json.profile.billingCountry ?? "EC",
          });
        }
      } catch (err: any) {
        setError(err.message ?? "Error cargando el perfil");
      }
    });
  }, [reset]);

  const onSubmit = (data: FormValues) => {
    setStatus("idle");
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json?.error ?? "No se pudo guardar el perfil");
        }
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setError(err.message ?? "Error guardando el perfil");
      }
    });
  };

  const sectionSx = {
    p: { xs: 2, md: 3 },
    borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.08)",
    bgcolor: "rgba(255,255,255,0.02)",
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: "rgba(255,255,255,0.03)",
      "& fieldset": {
        borderColor: "rgba(255,255,255,0.12)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255,255,255,0.2)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "secondary.main",
      },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.7)",
    },
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        {status === "success" && (
          <Alert severity="success">Perfil actualizado correctamente.</Alert>
        )}
        {status === "error" && error && <Alert severity="error">{error}</Alert>}

        <Paper sx={sectionSx}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Datos personales y de envío
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completa esta información para agilizar tus futuras compras y envíos.
              </Typography>
            </Box>
            <GridLegacy container spacing={2}>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Nombre"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("firstName") }}
                  {...register("firstName")}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Apellido"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("lastName") }}
                  {...register("lastName")}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Email"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("email") }}
                  {...register("email")}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Teléfono"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("phone") }}
                  {...register("phone")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={4}>
                <TextField
                  select
                  size="small"
                  SelectProps={{ native: true }}
                  label="Tipo identificación"
                  fullWidth
                  sx={inputSx}
                  {...register("documentType")}
                >
                  <option value="CEDULA">Cédula</option>
                  <option value="RUC">RUC</option>
                </TextField>
              </GridLegacy>
              <GridLegacy item xs={12} md={8}>
                <TextField
                  label="Nº identificación"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("documentId") }}
                  {...register("documentId")}
                />
              </GridLegacy>
              <GridLegacy item xs={12}>
                <TextField
                  label="Dirección principal"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("shippingLine1") }}
                  {...register("shippingLine1")}
                />
              </GridLegacy>
              <GridLegacy item xs={12}>
                <TextField
                  label="Referencia"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("shippingLine2") }}
                  {...register("shippingLine2")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={4}>
                <TextField
                  label="Ciudad"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("shippingCity") }}
                  {...register("shippingCity")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={4}>
                <TextField
                  label="Provincia/Estado"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("shippingState") }}
                  {...register("shippingState")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={4}>
                <TextField
                  label="Código postal"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("shippingPostalCode") }}
                  {...register("shippingPostalCode")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={4}>
                <TextField
                  label="País"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("shippingCountry") }}
                  {...register("shippingCountry")}
                  defaultValue="EC"
                />
              </GridLegacy>
            </GridLegacy>
          </Stack>
        </Paper>

        <Paper sx={sectionSx}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Datos de facturación
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usa estos datos si requieres factura con información específica.
              </Typography>
            </Box>
            <GridLegacy container spacing={2}>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Nombre"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("billingFirstName") }}
                  {...register("billingFirstName")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Apellido"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("billingLastName") }}
                  {...register("billingLastName")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Email"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("billingEmail") }}
                  {...register("billingEmail")}
                  error={!!errors.billingEmail}
                  helperText={errors.billingEmail?.message}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={6}>
                <TextField
                  label="Teléfono"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("billingPhone") }}
                  {...register("billingPhone")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={4}>
                <TextField
                  select
                  size="small"
                  SelectProps={{ native: true }}
                  label="Tipo identificación"
                  fullWidth
                  sx={inputSx}
                  {...register("billingDocumentType")}
                >
                  <option value="CEDULA">Cédula</option>
                  <option value="RUC">RUC</option>
                </TextField>
              </GridLegacy>
              <GridLegacy item xs={12} md={8}>
                <TextField
                  label="Nº identificación"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("billingDocumentId") }}
                  {...register("billingDocumentId")}
                />
              </GridLegacy>
              <GridLegacy item xs={12}>
                <TextField
                  label="Dirección"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("billingLine1") }}
                  {...register("billingLine1")}
                />
              </GridLegacy>
              <GridLegacy item xs={12}>
                <TextField
                  label="Referencia"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("billingLine2") }}
                  {...register("billingLine2")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={4}>
                <TextField
                  label="Ciudad"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("billingCity") }}
                  {...register("billingCity")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={4}>
                <TextField
                  label="Provincia/Estado"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("billingState") }}
                  {...register("billingState")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={4}>
                <TextField
                  label="Código postal"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("billingPostalCode") }}
                  {...register("billingPostalCode")}
                />
              </GridLegacy>
              <GridLegacy item xs={12} md={4}>
                <TextField
                  label="País"
                  fullWidth
                  size="small"
                  sx={inputSx}
                  InputLabelProps={{ shrink: !!watch("billingCountry") }}
                  {...register("billingCountry")}
                  defaultValue="EC"
                />
              </GridLegacy>
            </GridLegacy>
          </Stack>
        </Paper>

        <Paper
          sx={{
            ...sectionSx,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || isPending}
          >
            {isSubmitting || isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </Paper>
      </Stack>
    </form>
  );
}
