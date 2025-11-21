"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import Image from "next/image";

export type ImageUploadMode = "single" | "multiple";

export type UploadedImage = {
  url: string;
  file?: File;
  isNew?: boolean;
};

type ImageUploadFieldProps = {
  mode?: ImageUploadMode;
  value?: UploadedImage | UploadedImage[];
  onChange: (value: UploadedImage | UploadedImage[]) => void;
  productId?: string;
  label?: string;
  error?: string;
  /** Si es true, guarda archivos en memoria sin subir a S3 */
  deferUpload?: boolean;
};

export default function ImageUploadField({
  mode = "single",
  value,
  onChange,
  productId,
  label = "Subir imagen",
  error,
  deferUpload = false,
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images: UploadedImage[] = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validar archivos
    const invalidFiles = fileArray.filter(
      (file) => !file.type.match(/^image\/(jpeg|jpg|png)$/)
    );

    if (invalidFiles.length > 0) {
      setUploadError("Solo se permiten imágenes en formato JPG, JPEG o PNG");
      return;
    }

    const oversizedFiles = fileArray.filter(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (oversizedFiles.length > 0) {
      setUploadError("Las imágenes deben ser menores a 5MB");
      return;
    }

    setUploadError(null);
    uploadFiles(fileArray);
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setUploadError(null);

    try {
      // Si deferUpload está activado, solo guardar los archivos en memoria con preview
      if (deferUpload) {
        const uploadedImages: UploadedImage[] = files.map((file) => ({
          url: URL.createObjectURL(file), // URL temporal para preview
          file: file,
          isNew: true,
        }));

        if (mode === "single") {
          onChange(uploadedImages[0]);
        } else {
          onChange([...images, ...uploadedImages]);
        }
        
        setUploading(false);
        return;
      }

      // Modo normal: subir inmediatamente a S3
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });

      if (productId) {
        formData.append("productId", productId);
      }

      const response = await fetch("/api/admin/upload/product-images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || data.details?.join(", ") || "Error al subir imágenes"
        );
      }

      // Crear objetos de imagen con las URLs devueltas
      const uploadedImages: UploadedImage[] = data.urls.map(
        (url: string, index: number) => ({
          url,
          file: files[index],
          isNew: true,
        })
      );

      if (mode === "single") {
        onChange(uploadedImages[0]);
      } else {
        onChange([...images, ...uploadedImages]);
      }

      if (data.errors && data.errors.length > 0) {
        setUploadError(`Algunas imágenes no se pudieron subir: ${data.errors.join(", ")}`);
      }
    } catch (error: any) {
      console.error("Error uploading images:", error);
      setUploadError(error.message || "Error al subir imágenes");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleRemove = (index: number) => {
    if (mode === "single") {
      onChange({} as UploadedImage);
    } else {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Stack spacing={2}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        multiple={mode === "multiple"}
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      {/* Drop zone */}
      <Paper
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        sx={{
          p: 3,
          border: "2px dashed",
          borderColor: isDragging
            ? "primary.main"
            : error || uploadError
            ? "error.main"
            : "divider",
          bgcolor: isDragging ? "action.hover" : "background.default",
          cursor: uploading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          "&:hover": {
            borderColor: uploading ? "divider" : "primary.main",
            bgcolor: uploading ? "background.default" : "action.hover",
          },
        }}
      >
        <Stack alignItems="center" spacing={2}>
          {uploading ? (
            <>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary">
                Subiendo...
              </Typography>
            </>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 48, color: "action.active" }} />
              <Box textAlign="center">
                <Typography variant="body1" gutterBottom>
                  {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Arrastra {mode === "multiple" ? "imágenes" : "una imagen"} aquí
                  o haz clic para seleccionar
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Solo JPG, JPEG o PNG, máximo 5MB
                </Typography>
              </Box>
            </>
          )}
        </Stack>
      </Paper>

      {/* Errores */}
      {(error || uploadError) && (
        <Alert severity="error" onClose={() => setUploadError(null)}>
          {error || uploadError}
        </Alert>
      )}

      {/* Preview de imágenes */}
      {images.length > 0 && (
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" color="text.secondary">
            {mode === "single" ? "Imagen cargada" : `${images.length} imagen(es) cargada(s)`}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {images.map((img, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  position: "relative",
                  paddingTop: "100%",
                  borderRadius: 2,
                  overflow: "hidden",
                  "&:hover .delete-button": {
                    opacity: 1,
                  },
                }}
              >
                {img.url ? (
                  <Image
                    src={img.url}
                    alt={`Preview ${index + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "action.hover",
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, color: "action.active" }} />
                  </Box>
                )}
                <IconButton
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "rgba(0, 0, 0, 0.6)",
                    color: "white",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.8)",
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                {img.isNew && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: "success.main",
                      color: "white",
                      py: 0.5,
                      px: 1,
                      fontSize: "0.75rem",
                      textAlign: "center",
                    }}
                  >
                    Nuevo
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        </Stack>
      )}
    </Stack>
  );
}

