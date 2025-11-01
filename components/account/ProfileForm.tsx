"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  Grid,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={4}>
        {status === "success" && (
          <Alert severity="success">Perfil actualizado correctamente.</Alert>
        )}
        {status === "error" && error && <Alert severity="error">{error}</Alert>}

        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Datos personales y de envío
          </Typography>
          <GridLegacy container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nombre"
                fullWidth
                {...register("firstName")}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Apellido"
                fullWidth
                {...register("lastName")}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                fullWidth
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Teléfono" fullWidth {...register("phone")} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                SelectProps={{ native: true }}
                label="Tipo identificación"
                fullWidth
                {...register("documentType")}
              >
                <option value="CEDULA">Cédula</option>
                <option value="RUC">RUC</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField label="Nº identificación" fullWidth {...register("documentId")} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Dirección principal"
                fullWidth
                {...register("shippingLine1")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Referencia" fullWidth {...register("shippingLine2")} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Ciudad" fullWidth {...register("shippingCity")} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Provincia/Estado" fullWidth {...register("shippingState")} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Código postal"
                fullWidth
                {...register("shippingPostalCode")}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="País"
                fullWidth
                {...register("shippingCountry")}
                defaultValue="EC"
              />
            </Grid>
          </GridLegacy>
        </Box>

        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Datos de facturación
          </Typography>
          <GridLegacy container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nombre"
                fullWidth
                {...register("billingFirstName")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Apellido"
                fullWidth
                {...register("billingLastName")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                fullWidth
                {...register("billingEmail")}
                error={!!errors.billingEmail}
                helperText={errors.billingEmail?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Teléfono"
                fullWidth
                {...register("billingPhone")}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                SelectProps={{ native: true }}
                label="Tipo identificación"
                fullWidth
                {...register("billingDocumentType")}
              >
                <option value="CEDULA">Cédula</option>
                <option value="RUC">RUC</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                label="Nº identificación"
                fullWidth
                {...register("billingDocumentId")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Dirección" fullWidth {...register("billingLine1")} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Referencia" fullWidth {...register("billingLine2")} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Ciudad" fullWidth {...register("billingCity")} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Provincia/Estado" fullWidth {...register("billingState")} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Código postal"
                fullWidth
                {...register("billingPostalCode")}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="País"
                fullWidth
                {...register("billingCountry")}
                defaultValue="EC"
              />
            </Grid>
          </GridLegacy>
        </Box>

        <Box display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || isPending}
          >
            {isSubmitting || isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </Box>
      </Stack>
    </form>
  );
}
