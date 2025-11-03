"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  MenuItem,
  Grid,
  Chip,
  IconButton,
} from "@mui/material";
import GridLegacy from "@mui/material/GridLegacy";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import { format } from "date-fns";

const problemCategorySchema = z.enum(["HARDWARE", "SOFTWARE"]);

const hardwareSubcategories = [
  "Equipo no enciende",
  "Pantalla en negro o sin imagen",
  "Sobrecalentamiento",
  "Ventilador ruidoso o no funciona",
  "Puerto USB dañado",
  "Teclado o touchpad no responde",
  "Batería no carga o se descarga rápido",
  "Disco duro hace ruido",
  "Equipo se apaga solo",
  "Problemas de conexión WiFi",
  "Otro problema de hardware",
];

const softwareSubcategories = [
  "Virus o malware",
  "Sistema deja de responder inesperadamente",
  "Pantalla azul (BSOD)",
  "Windows no inicia",
  "Programas se cierran solos",
  "Lentitud extrema del sistema",
  "Archivos corruptos o no se abren",
  "Problemas de actualización de Windows",
  "Error de disco duro",
  "Programas no se instalan",
  "Otro problema de software",
];

const formSchema = z.object({
  category: problemCategorySchema,
  subcategory: z.string().min(1, "Debes seleccionar una subcategoría"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  images: z.array(z.instanceof(File)).optional(),
  date: z.date({ required_error: "Debes seleccionar una fecha" }),
  time: z.string().regex(/^(1[0-7]|0[0-9]):(00|30)$/, "Debes seleccionar una hora válida"),
});

type FormValues = z.infer<typeof formSchema>;

const timeSlots = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

export default function HardwareSchedulePage() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "HARDWARE",
      subcategory: "",
      description: "",
      images: [],
      time: "",
    },
  });

  const selectedCategory = watch("category");
  const selectedDate = watch("date");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = files.slice(0, 5); // Máximo 5 imágenes
    setValue("images", newFiles);

    // Crear previews
    const previews: string[] = [];
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push(reader.result as string);
        if (previews.length === newFiles.length) {
          setImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const currentImages = watch("images") || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setValue("images", newImages);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 días en el futuro
    return maxDate;
  };

  const onSubmit = (data: FormValues) => {
    setStatus("idle");
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("category", data.category);
        formData.append("subcategory", data.subcategory);
        formData.append("description", data.description);
        formData.append("date", format(data.date, "yyyy-MM-dd"));
        formData.append("time", data.time);

        // Agregar imágenes
        if (data.images && data.images.length > 0) {
          data.images.forEach((file, index) => {
            formData.append(`image_${index}`, file);
          });
        }

        const res = await fetch("/api/services/hardware/schedule", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "No se pudo enviar la solicitud");
        }

        setStatus("success");
        // Reset form
        setValue("category", "HARDWARE");
        setValue("subcategory", "");
        setValue("description", "");
        setValue("images", []);
        setValue("date", undefined as any);
        setValue("time", "");
        setImagePreviews([]);
      } catch (e: any) {
        setStatus("error");
        setError(e.message || "Error al enviar la solicitud");
      }
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box
        component="main"
        sx={{
          bgcolor: "#050506",
          color: "text.primary",
          minHeight: "100vh",
          py: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="md">
          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              bgcolor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography variant="h4" fontWeight={700} mb={3}>
              Agenda una cita para revisión de hardware
            </Typography>

            {status === "success" && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Tu solicitud de cita ha sido enviada correctamente. Te contactaremos pronto.
              </Alert>
            )}
            {status === "error" && error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack spacing={3}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label="Tipo de problema"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.category}
                      helperText={errors.category?.message}
                      {...field}
                    >
                      <MenuItem value="HARDWARE">Hardware</MenuItem>
                      <MenuItem value="SOFTWARE">Software</MenuItem>
                    </TextField>
                  )}
                />

                <Controller
                  name="subcategory"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label="Subcategoría"
                      fullWidth
                      InputLabelProps={{ shrink: !!watch("subcategory") }}
                      error={!!errors.subcategory}
                      helperText={errors.subcategory?.message}
                      disabled={!selectedCategory}
                      {...field}
                    >
                      {selectedCategory === "HARDWARE"
                        ? hardwareSubcategories.map((sub) => (
                            <MenuItem key={sub} value={sub}>
                              {sub}
                            </MenuItem>
                          ))
                        : softwareSubcategories.map((sub) => (
                            <MenuItem key={sub} value={sub}>
                              {sub}
                            </MenuItem>
                          ))}
                    </TextField>
                  )}
                />

                <TextField
                  label="Descripción del problema"
                  fullWidth
                  multiline
                  rows={4}
                  InputLabelProps={{ shrink: !!watch("description") }}
                  {...register("description")}
                  error={!!errors.description}
                  helperText={errors.description?.message || "Describe detalladamente el problema que estás experimentando"}
                />

                <Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Imágenes del problema (opcional, máximo 5)
                  </Typography>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="image-upload"
                    type="file"
                    multiple
                    onChange={handleImageChange}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      component="span"
                      variant="outlined"
                      startIcon={<ImageIcon />}
                      sx={{ mb: 2 }}
                    >
                      Seleccionar imágenes
                    </Button>
                  </label>
                  {imagePreviews.length > 0 && (
                    <GridLegacy container spacing={2} sx={{ mt: 1 }}>
                      {imagePreviews.map((preview, index) => (
                        <GridLegacy item xs={6} sm={4} key={index}>
                          <Box
                            sx={{
                              position: "relative",
                              width: "100%",
                              paddingTop: "100%",
                              borderRadius: 2,
                              overflow: "hidden",
                              border: "1px solid rgba(255,255,255,0.12)",
                            }}
                          >
                            <Box
                              component="img"
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => removeImage(index)}
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                bgcolor: "rgba(0,0,0,0.7)",
                                color: "error.main",
                                "&:hover": { bgcolor: "rgba(0,0,0,0.9)" },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </GridLegacy>
                      ))}
                    </GridLegacy>
                  )}
                </Box>

                <GridLegacy container spacing={2}>
                  <GridLegacy item xs={12} md={6}>
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          label="Fecha de atención"
                          minDate={getMinDate()}
                          maxDate={getMaxDate()}
                          disablePast
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.date,
                              helperText: errors.date?.message,
                              InputLabelProps: { shrink: !!field.value },
                            },
                          }}
                          {...field}
                        />
                      )}
                    />
                  </GridLegacy>
                  <GridLegacy item xs={12} md={6}>
                    <Controller
                      name="time"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          select
                          label="Hora de atención"
                          fullWidth
                          InputLabelProps={{ shrink: !!field.value }}
                          error={!!errors.time}
                          helperText={errors.time?.message || "10:00 AM - 6:00 PM"}
                          disabled={!selectedDate}
                          {...field}
                        >
                          {timeSlots.map((slot) => (
                            <MenuItem key={slot} value={slot}>
                              {slot} {parseInt(slot.split(":")[0]) >= 12 ? "PM" : "AM"}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </GridLegacy>
                </GridLegacy>

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={isPending}
                  >
                    {isPending ? "Enviando..." : "Enviar solicitud"}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Paper>
        </Container>
      </Box>
    </LocalizationProvider>
  );
}