"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SaveIcon from "@mui/icons-material/Save";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LinkIcon from "@mui/icons-material/Link";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ListItem from "@mui/material/ListItem";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { slugify } from "@/lib/slug";
import type { AdminCategory, AdminProduct } from "@/lib/products/types";
import {
  ProductInputSchema,
  type ProductInput,
} from "@/lib/validation/products";
import {
  CategoryInputSchema,
  type CategoryInput,
} from "@/lib/validation/categories";
import ImageUploadField, { type UploadedImage } from "./ImageUploadField";

const formDefaults = (): ProductInput => ({
  name: "",
  slug: "",
  description: "",
  price: 0,
  stock: 0,
  imageUrl: "",
  images: [],
  categoryId: null,
  isFeatured: false,
});

type FormValues = ProductInput;
type CategoryFormValues = CategoryInput;

type StatusMessage = { type: "success" | "error"; text: string } | null;

type Props = {
  initialProducts: AdminProduct[];
  adminName: string;
  categories: AdminCategory[];
  initialTab?: "create" | "edit" | "categories";
  onCategoriesUpdate?: (categories: AdminCategory[]) => void;
};

const categoryDefaults = (): CategoryFormValues => ({
  name: "",
  slug: "",
});

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-EC", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (e) {
    return iso;
  }
}

function toFormValues(product: AdminProduct): FormValues {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    price: product.price,
    stock: product.stock,
    imageUrl: product.imageUrl ?? "",
    categoryId: product.category?.id ?? null,
    isFeatured: product.isFeatured ?? false,
    images: product.images.map((img, index) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? "",
      sortOrder: index,
    })),
  };
}

/**
 * Verifica si una URL es una imagen que debe mostrarse como preview
 * (blob URLs o URLs de S3)
 */
function shouldShowImagePreview(url: string | null | undefined): boolean {
  if (!url) return false;
  // Blob URLs (imágenes cargadas localmente)
  if (url.startsWith("blob:")) return true;
  // URLs de S3
  if (url.includes(".s3.") || url.includes("amazonaws.com")) return true;
  // URLs que terminan en extensiones de imagen comunes
  if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)) return true;
  return false;
}

// Componente para mostrar cada categoría en la lista
function CategoryListItem({
  category,
  onUpdate,
  onDelete,
}: {
  category: AdminCategory;
  onUpdate: (id: string, name: string, slug?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editSlug, setEditSlug] = useState(category.slug);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!editName.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdate(category.id, editName.trim(), editSlug.trim() || undefined);
      setEditing(false);
    } catch (error) {
      // El error ya se maneja en el callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditName(category.name);
    setEditSlug(category.slug);
    setEditing(false);
  };

  return (
    <ListItem
      sx={{
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 1,
        mb: 1,
        bgcolor: "rgba(255,255,255,0.02)",
      }}
    >
      {editing ? (
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
          <TextField
            size="small"
            label="Nombre"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label="Slug"
            value={editSlug}
            onChange={(e) => setEditSlug(e.target.value)}
            fullWidth
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              disabled={isSubmitting || !editName.trim()}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              Guardar
            </Button>
          </Stack>
        </Box>
      ) : (
        <>
          <ListItemText
            primary={category.name}
            secondary={`Slug: ${category.slug}`}
          />
          <ListItemSecondaryAction>
            <Stack direction="row" spacing={1}>
              <IconButton
                edge="end"
                size="small"
                onClick={() => setEditing(true)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                edge="end"
                size="small"
                onClick={() => onDelete(category.id)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </ListItemSecondaryAction>
        </>
      )}
    </ListItem>
  );
}

function normalizePayload(values: FormValues): FormValues {
  const categoryId =
    typeof values.categoryId === "string"
      ? values.categoryId.trim() || null
      : null;

  return {
    ...values,
    name: values.name.trim(),
    slug: values.slug?.trim() ?? "",
    description: values.description?.trim() ?? "",
    imageUrl: typeof values.imageUrl === "string" && values.imageUrl.trim() ? values.imageUrl.trim() : null,
    categoryId,
    images: (values.images ?? [])
      .filter((img) => img && img.url && typeof img.url === "string" && img.url.trim().length > 0)
      .map((img, index) => ({
        id: img.id,
        url: img.url.trim(),
        alt: img.alt?.trim() ?? "",
        sortOrder: index,
      })),
  };
}

export default function AdminProductManager({
  initialProducts,
  adminName,
  categories,
  initialTab,
  onCategoriesUpdate,
}: Props) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [createStatus, setCreateStatus] = useState<StatusMessage>(null);
  const [updateStatus, setUpdateStatus] = useState<StatusMessage>(null);
  const [deleteStatus, setDeleteStatus] = useState<StatusMessage>(null);
  const [categoryStatus, setCategoryStatus] = useState<StatusMessage>(null);
  const [categoryList, setCategoryList] = useState<AdminCategory[]>(categories);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado para Snackbar (mensajes flotantes)
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Estados para controlar el modo de upload de imágenes
  const [createMainImageMode, setCreateMainImageMode] = useState<"url" | "upload">("url");
  const [editMainImageMode, setEditMainImageMode] = useState<"url" | "upload">("url");

  // Estados para guardar archivos File pendientes de subir (crear)
  const [pendingMainImageFile, setPendingMainImageFile] = useState<File | null>(null);
  const [pendingGalleryFiles, setPendingGalleryFiles] = useState<Map<string, File>>(new Map());

  // Estados para guardar archivos File pendientes de subir (editar)
  const [pendingEditMainImageFile, setPendingEditMainImageFile] = useState<File | null>(null);
  const [pendingEditGalleryFiles, setPendingEditGalleryFiles] = useState<Map<string, File>>(new Map());

  const [selectedId, setSelectedId] = useState<string | null>(
    initialProducts[0]?.id ?? null
  );

  // Estado para el buscador de productos
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Sincronizar categorías cuando cambien desde el padre
  useEffect(() => {
    setCategoryList(categories);
  }, [categories]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId]
  );

  // Filtrar productos por nombre usando el buscador
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) {
      return products;
    }
    const query = productSearchQuery.toLowerCase().trim();
    return products.filter((p) =>
      p.name.toLowerCase().includes(query)
    );
  }, [products, productSearchQuery]);

  const createForm = useForm<FormValues>({
    resolver: zodResolver(ProductInputSchema),
    defaultValues: formDefaults(),
    mode: "onBlur",
  });
  const createImages = useFieldArray({
    control: createForm.control,
    name: "images",
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(ProductInputSchema),
    defaultValues: formDefaults(),
    mode: "onBlur",
  });
  const editImages = useFieldArray({
    control: editForm.control,
    name: "images",
  });

  const { reset: resetEditForm } = editForm;

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryInputSchema),
    defaultValues: categoryDefaults(),
    mode: "onBlur",
  });

  useEffect(() => {
    if (selectedProduct) {
      resetEditForm(toFormValues(selectedProduct));
      setUpdateStatus(null);
    } else {
      resetEditForm(formDefaults());
    }
    setIsDeleting(false);
    // Limpiar estados de archivos pendientes al cambiar de producto
    setPendingEditMainImageFile(null);
    setPendingEditGalleryFiles(new Map());
  }, [selectedProduct, resetEditForm]);

  // El slug ahora se genera automáticamente, no necesitamos esta función
  // Se mantiene para compatibilidad pero no se usa

  const editSlugFromName = () => {
    const name = editForm.getValues("name");
    if (!name) return;
    editForm.setValue("slug", slugify(name), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const createCategorySlugFromName = () => {
    const name = categoryForm.getValues("name");
    if (!name) return;
    categoryForm.setValue("slug", slugify(name), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const normalizeCategoryPayload = (values: CategoryFormValues) => ({
    name: values.name.trim(),
    slug: values.slug?.trim() ? values.slug.trim() : undefined,
  });

  const onCreate = createForm.handleSubmit(
    async (values) => {
      setCreateStatus(null);
      
      // Variables para rollback si algo falla
      let createdProductId: string | null = null;
      let uploadedMainImageUrl: string | null = null;
      const uploadedGalleryImageUrls: string[] = [];
      
      try {
        // Generar slug automáticamente si está vacío
        if (!values.slug || values.slug.trim() === "") {
          values.slug = slugify(values.name);
        }
        
        let payload = normalizePayload(values);

        // Si estamos en modo "upload", necesitamos crear el producto primero para obtener el ID
        // y luego subir las imágenes a products/[product-id]/
        if (createMainImageMode === "upload" && (pendingMainImageFile || pendingGalleryFiles.size > 0)) {
          // Crear el producto primero sin imágenes blob
          // Las imágenes se subirán después con el ID real
          // IMPORTANTE: Asegurarnos de incluir TODOS los campos necesarios
          const tempPayload = {
            name: payload.name,
            slug: payload.slug,
            description: payload.description || null,
            price: payload.price,
            stock: payload.stock,
            categoryId: payload.categoryId,
            imageUrl: null, // Dejar null temporalmente (las imágenes blob no se envían)
            images: payload.images?.filter(img => img.url && !img.url.startsWith("blob:")) || [], // Solo mantener URLs no-blob válidas
          };

          const createRes = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tempPayload),
          });

          const createJson = await createRes.json();
          if (!createRes.ok) {
            // CRÍTICO: Si la creación falla, NO subimos imágenes a S3
            // Si es un error de validación, mostrar detalles
            if (createRes.status === 422 && createJson.issues) {
              const issues = createJson.issues.map((issue: any) => 
                `${issue.path.join('.')}: ${issue.message}`
              ).join(', ');
              throw new Error(`Datos inválidos: ${issues}`);
            }
            throw new Error(createJson?.error ?? "No se pudo crear el producto");
          }

          // IMPORTANTE: Solo si el producto se creó exitosamente, procedemos a subir imágenes
          const created = createJson as AdminProduct;
          createdProductId = created.id; // Guardar ID para rollback

          // Ahora subir las imágenes usando el ID real del producto (solo si el producto se creó exitosamente)
          const updatePayload: any = {};

          // Subir imagen principal si hay un archivo pendiente
          if (pendingMainImageFile) {
            const formData = new FormData();
            formData.append("images", pendingMainImageFile);
            formData.append("productId", createdProductId);

            const uploadRes = await fetch("/api/admin/upload/product-images", {
              method: "POST",
              body: formData,
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok || !uploadData.success) {
              throw new Error(uploadData.error || "Error al subir imagen principal");
            }

            uploadedMainImageUrl = uploadData.urls[0]; // Guardar URL para rollback
            updatePayload.imageUrl = uploadedMainImageUrl;
          }

          // Subir imágenes de galería si hay archivos pendientes
          if (pendingGalleryFiles.size > 0) {
            const galleryFilesArray = Array.from(pendingGalleryFiles.values());
            const formData = new FormData();
            galleryFilesArray.forEach((file) => {
              formData.append("images", file);
            });
            formData.append("productId", createdProductId);

            const uploadRes = await fetch("/api/admin/upload/product-images", {
              method: "POST",
              body: formData,
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok || !uploadData.success) {
              throw new Error(uploadData.error || "Error al subir imágenes de galería");
            }

            // Guardar URLs para rollback
            uploadedGalleryImageUrls.push(...uploadData.urls);

            // Reemplazar las URLs blob con las URLs reales de S3
            const uploadedUrls = uploadData.urls;
            const blobImages = (payload.images || []).filter(img => img.url.startsWith("blob:"));
            const nonBlobImages = (payload.images || []).filter(img => !img.url.startsWith("blob:"));
            
            updatePayload.images = [
              ...nonBlobImages,
              ...blobImages.map((img, index) => ({
                ...img,
                url: uploadedUrls[index] || img.url,
              })),
            ];
          }

          // Actualizar el producto con las URLs de las imágenes
          // IMPORTANTE: El endpoint PUT requiere todos los campos, no solo los que cambiamos
          if (Object.keys(updatePayload).length > 0) {
            // Construir el payload completo con todos los campos del producto
            const fullUpdatePayload = {
              name: payload.name,
              slug: payload.slug,
              description: payload.description || null,
              price: payload.price,
              stock: payload.stock,
              categoryId: payload.categoryId,
              imageUrl: updatePayload.imageUrl ?? created.imageUrl ?? null,
              images: updatePayload.images ?? created.images?.map(img => ({
                id: img.id,
                url: img.url,
                alt: img.alt ?? "",
                sortOrder: img.sortOrder ?? 0,
              })) ?? [],
            };

            const updateRes = await fetch(`/api/products/${createdProductId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(fullUpdatePayload),
            });

            const updateJson = await updateRes.json();
            if (!updateRes.ok) {
              // Si es un error de validación, mostrar detalles
              if (updateRes.status === 422 && updateJson.issues) {
                const issues = updateJson.issues.map((issue: any) => 
                  `${issue.path.join('.')}: ${issue.message}`
                ).join(', ');
                throw new Error(`Error al actualizar producto: ${issues}`);
              }
              throw new Error(updateJson?.error ?? "No se pudo actualizar las imágenes del producto");
            }

            const updated = updateJson as AdminProduct;
            // Actualizar estado ANTES de limpiar - esto asegura que el producto aparezca inmediatamente
            setProducts((prev) => {
              // Eliminar producto antiguo si existe y agregar el actualizado al inicio
              const filtered = prev.filter(p => p.id !== updated.id);
              return [updated, ...filtered];
            });
            setSelectedId(updated.id);
            setCreateStatus({ type: "success", text: "Producto creado correctamente." });
            setSnackbar({
              open: true,
              message: "Producto creado correctamente",
              severity: "success",
            });
          } else {
            // Si no hay imágenes para actualizar, solo agregar el producto creado
            setProducts((prev) => {
              const filtered = prev.filter(p => p.id !== created.id);
              return [created, ...filtered];
            });
            setSelectedId(created.id);
            setCreateStatus({ type: "success", text: "Producto creado correctamente." });
            setSnackbar({
              open: true,
              message: "Producto creado correctamente",
              severity: "success",
            });
          }
        } else {
          // Modo URL o sin imágenes - crear normalmente
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const json = await res.json();
          if (!res.ok) {
            // Si es un error de validación, mostrar detalles
            if (res.status === 422 && json.issues) {
              const issues = json.issues.map((issue: any) => 
                `${issue.path.join('.')}: ${issue.message}`
              ).join(', ');
              throw new Error(`Datos inválidos: ${issues}`);
            }
            throw new Error(json?.error ?? "No se pudo crear el producto");
          }

          const created = json as AdminProduct;
          createdProductId = created.id; // Guardar ID para rollback (aunque no debería ser necesario aquí)
          // Actualizar estado ANTES de limpiar
          setProducts((prev) => {
            const filtered = prev.filter(p => p.id !== created.id);
            return [created, ...filtered];
          });
          setSelectedId(created.id);
          setCreateStatus({ type: "success", text: "Producto creado correctamente." });
          setSnackbar({
            open: true,
            message: "Producto creado correctamente",
            severity: "success",
          });
        }
        
        // Limpiar estados SOLO después de éxito completo
        createForm.reset(formDefaults());
        createImages.replace([]);
        setPendingMainImageFile(null);
        setPendingGalleryFiles(new Map());
      } catch (error: any) {
        setCreateStatus({
          type: "error",
          text: error?.message ?? "Error desconocido al crear el producto.",
        });
        setSnackbar({
          open: true,
          message: error?.message ?? "Error al crear el producto",
          severity: "error",
        });

        // ROLLBACK: Si se creó el producto pero algo falló después, eliminarlo
        if (createdProductId) {
          console.warn(`Rollback: Eliminando producto ${createdProductId} debido a error.`);
          try {
            // Eliminar producto de la base de datos (esto también eliminará las imágenes de la BD)
            const deleteRes = await fetch(`/api/products/${createdProductId}`, {
              method: "DELETE",
            });
            
            if (!deleteRes.ok) {
              console.error(`Error al eliminar producto durante rollback: ${deleteRes.status}`);
            } else {
              console.log(`Rollback exitoso: Producto ${createdProductId} eliminado.`);
            }
          } catch (rollbackError: any) {
            console.error(`Error durante rollback del producto ${createdProductId}:`, rollbackError);
            // No lanzar el error, solo loguearlo para que el usuario vea el error original
          }
        }
      }
    }
  );

  const onUpdate = editForm.handleSubmit(async (values) => {
    if (!selectedProduct) return;
    setUpdateStatus(null);
    
    try {
      let payload = normalizePayload(values);

      // Si estamos en modo "upload", subir archivos a S3 primero
      if (editMainImageMode === "upload") {
        // Subir imagen principal si hay un archivo pendiente
        if (pendingEditMainImageFile) {
          const formData = new FormData();
          formData.append("images", pendingEditMainImageFile);
          formData.append("productId", selectedProduct.id);

          const uploadRes = await fetch("/api/admin/upload/product-images", {
            method: "POST",
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || !uploadData.success) {
            throw new Error(uploadData.error || "Error al subir imagen principal");
          }

          // Reemplazar la URL blob con la URL real de S3
          payload.imageUrl = uploadData.urls[0];
        }

        // Subir imágenes de galería si hay archivos pendientes
        if (pendingEditGalleryFiles.size > 0) {
          const galleryFilesArray = Array.from(pendingEditGalleryFiles.values());
          const formData = new FormData();
          galleryFilesArray.forEach((file) => {
            formData.append("images", file);
          });
          formData.append("productId", selectedProduct.id);

          const uploadRes = await fetch("/api/admin/upload/product-images", {
            method: "POST",
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || !uploadData.success) {
            throw new Error(uploadData.error || "Error al subir imágenes de galería");
          }

          // Reemplazar las URLs blob con las URLs reales de S3
          const uploadedUrls = uploadData.urls;
          let urlIndex = 0;
          payload.images = payload.images.map((img) => {
            if (img.url.startsWith("blob:")) {
              return {
                ...img,
                url: uploadedUrls[urlIndex++] || img.url,
              };
            }
            return img;
          });
        }
      }

      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "No se pudo actualizar el producto");
      }

      const updated = json as AdminProduct;
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setSelectedId(updated.id);
      setUpdateStatus({
        type: "success",
        text: "Producto actualizado correctamente.",
      });
      setSnackbar({
        open: true,
        message: "Producto editado correctamente",
        severity: "success",
      });
      
      // Limpiar estados de archivos pendientes
      setPendingEditMainImageFile(null);
      setPendingEditGalleryFiles(new Map());
    } catch (error: any) {
      setUpdateStatus({
        type: "error",
        text: error?.message ?? "Error desconocido al actualizar el producto.",
      });
      setSnackbar({
        open: true,
        message: error?.message ?? "Error al editar el producto",
        severity: "error",
      });
    }
  });

  const onCreateCategory = categoryForm.handleSubmit(async (values) => {
    setCategoryStatus(null);
    const payload = normalizeCategoryPayload(values);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "No se pudo crear la categoría");
      }

      const created = json as AdminCategory;
      const updatedCategories = [...categoryList, created].sort((a, b) => a.name.localeCompare(b.name));
      setCategoryList(updatedCategories);
      // Notificar al componente padre para que actualice el estado compartido
      if (onCategoriesUpdate) {
        onCategoriesUpdate(updatedCategories);
      }
      categoryForm.reset(categoryDefaults());
      createForm.setValue("categoryId", created.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setCategoryStatus({
        type: "success",
        text: "Categoría creada correctamente.",
      });
    } catch (error: any) {
      setCategoryStatus({
        type: "error",
        text: error?.message ?? "Error desconocido al crear la categoría.",
      });
    }
  });

  const handleDeleteProduct = async () => {
    if (!selectedProduct || isDeleting) return;
    const confirmed = window.confirm(
      `¿Eliminar el producto "${selectedProduct.name}" de forma permanente?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteStatus(null);
    setUpdateStatus(null);

    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "DELETE",
      });

      const json = res.status !== 204 ? await res.json().catch(() => null) : null;
      if (!res.ok) {
        throw new Error(json?.error ?? "No se pudo eliminar el producto");
      }

      const deletedId = selectedProduct.id;
      setProducts((prev) => {
        const next = prev.filter((p) => p.id !== deletedId);
        if (selectedId === deletedId) {
          setSelectedId(next[0]?.id ?? null);
        }
        return next;
      });
      setDeleteStatus({
        type: "success",
        text: "Producto eliminado correctamente.",
      });
    } catch (error: any) {
      setDeleteStatus({
        type: "error",
        text: error?.message ?? "Error desconocido al eliminar el producto.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const content = (
      <Stack spacing={4}>
        {!initialTab && (
          <>
            <Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h3" fontWeight={900} gutterBottom>
                    Panel de administración
                  </Typography>
                  <Typography color="text.secondary">
                    Hola {adminName}, aquí puedes crear y mantener los productos de
                    la tienda. Por ahora las imágenes se gestionan mediante URLs
                    externas; la estructura ya contempla una galería para futuras
                    cargas directas a S3 u otros orígenes.
                  </Typography>
                </Box>

                <Link href="/" style={{ textDecoration: "none" }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                  >
                    Volver a la tienda
                  </Button>
                </Link>
              </Stack>
            </Box>

            <Alert severity="info">
              Asegúrate de usar URLs accesibles públicamente por el momento. Cuando
              integremos buckets de S3 bastará con reemplazar el origen de las
              imágenes sin cambiar esta interfaz.
            </Alert>
          </>
        )}

        {(!initialTab || initialTab === "create" || initialTab === "categories") && (
          <Box sx={{ width: "100%", mx: 0, px: 0, overflow: "hidden" }}>
            {(!initialTab || initialTab === "create") && (
              <Stack component="form" spacing={2.5} onSubmit={createForm.handleSubmit(
                async (data) => {
                  console.log("✅ Form validation passed, submitting...");
                  
                  // Generar slug automáticamente si está vacío
                  if (!data.slug || data.slug.trim() === "") {
                    data.slug = slugify(data.name);
                    console.log("Slug generado automáticamente:", data.slug);
                  }
                  
                  // Llamar directamente a la lógica de creación
                  setCreateStatus(null);
                  
                  // Variables para rollback si algo falla
                  let createdProductId: string | null = null;
                  let uploadedMainImageUrl: string | null = null;
                  const uploadedGalleryImageUrls: string[] = [];
                  
                  try {
                    let payload = normalizePayload(data);

                    // Si estamos en modo "upload", necesitamos crear el producto primero para obtener el ID
                    if (createMainImageMode === "upload" && (pendingMainImageFile || pendingGalleryFiles.size > 0)) {
                      const tempPayload = {
                        name: payload.name,
                        slug: payload.slug,
                        description: payload.description || null,
                        price: payload.price,
                        stock: payload.stock,
                        categoryId: payload.categoryId,
                        imageUrl: null,
                        images: payload.images?.filter(img => img.url && !img.url.startsWith("blob:")) || [],
                      };

                      console.log("Creating product with payload:", tempPayload);
                      const createRes = await fetch("/api/products", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(tempPayload),
                      });

                      const createJson = await createRes.json();
                      if (!createRes.ok) {
                        if (createRes.status === 422 && createJson.issues) {
                          const issues = createJson.issues.map((issue: any) => 
                            `${issue.path.join('.')}: ${issue.message}`
                          ).join(', ');
                          throw new Error(`Datos inválidos: ${issues}`);
                        }
                        throw new Error(createJson?.error ?? "No se pudo crear el producto");
                      }

                      const created = createJson as AdminProduct;
                      createdProductId = created.id;
                      const updatePayload: any = {};

                      if (pendingMainImageFile) {
                        const formData = new FormData();
                        formData.append("images", pendingMainImageFile);
                        formData.append("productId", createdProductId);

                        const uploadRes = await fetch("/api/admin/upload/product-images", {
                          method: "POST",
                          body: formData,
                        });

                        const uploadData = await uploadRes.json();
                        if (!uploadRes.ok || !uploadData.success) {
                          throw new Error(uploadData.error || "Error al subir imagen principal");
                        }

                        uploadedMainImageUrl = uploadData.urls[0];
                        updatePayload.imageUrl = uploadedMainImageUrl;
                      }

                      if (pendingGalleryFiles.size > 0) {
                        const galleryFilesArray = Array.from(pendingGalleryFiles.values());
                        const formData = new FormData();
                        galleryFilesArray.forEach((file) => {
                          formData.append("images", file);
                        });
                        formData.append("productId", createdProductId);

                        const uploadRes = await fetch("/api/admin/upload/product-images", {
                          method: "POST",
                          body: formData,
                        });

                        const uploadData = await uploadRes.json();
                        if (!uploadRes.ok || !uploadData.success) {
                          throw new Error(uploadData.error || "Error al subir imágenes de galería");
                        }

                        uploadedGalleryImageUrls.push(...uploadData.urls);
                        const uploadedUrls = uploadData.urls;
                        const blobImages = (payload.images || []).filter(img => img.url.startsWith("blob:"));
                        const nonBlobImages = (payload.images || []).filter(img => !img.url.startsWith("blob:"));
                        
                        updatePayload.images = [
                          ...nonBlobImages,
                          ...blobImages.map((img, index) => ({
                            ...img,
                            url: uploadedUrls[index] || img.url,
                          })),
                        ];
                      }

                      if (Object.keys(updatePayload).length > 0) {
                        const fullUpdatePayload = {
                          name: payload.name,
                          slug: payload.slug,
                          description: payload.description || null,
                          price: payload.price,
                          stock: payload.stock,
                          categoryId: payload.categoryId,
                          imageUrl: updatePayload.imageUrl ?? created.imageUrl ?? null,
                          images: updatePayload.images ?? created.images?.map(img => ({
                            id: img.id,
                            url: img.url,
                            alt: img.alt ?? "",
                            sortOrder: img.sortOrder ?? 0,
                          })) ?? [],
                        };

                        const updateRes = await fetch(`/api/products/${createdProductId}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(fullUpdatePayload),
                        });

                        const updateJson = await updateRes.json();
                        if (!updateRes.ok) {
                          if (updateRes.status === 422 && updateJson.issues) {
                            const issues = updateJson.issues.map((issue: any) => 
                              `${issue.path.join('.')}: ${issue.message}`
                            ).join(', ');
                            throw new Error(`Error al actualizar producto: ${issues}`);
                          }
                          throw new Error(updateJson?.error ?? "No se pudo actualizar las imágenes del producto");
                        }

                        const updated = updateJson as AdminProduct;
                        setProducts((prev) => {
                          const filtered = prev.filter(p => p.id !== updated.id);
                          return [updated, ...filtered];
                        });
                        setSelectedId(updated.id);
                        setCreateStatus({ type: "success", text: "Producto creado correctamente." });
                        setSnackbar({
                          open: true,
                          message: "Producto creado correctamente",
                          severity: "success",
                        });
                      } else {
                        setProducts((prev) => {
                          const filtered = prev.filter(p => p.id !== created.id);
                          return [created, ...filtered];
                        });
                        setSelectedId(created.id);
                        setCreateStatus({ type: "success", text: "Producto creado correctamente." });
                        setSnackbar({
                          open: true,
                          message: "Producto creado correctamente",
                          severity: "success",
                        });
                      }
                    } else {
                      // Modo URL o sin imágenes - crear normalmente
                      console.log("Creating product (URL mode) with payload:", payload);
                      const res = await fetch("/api/products", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      });

                      const json = await res.json();
                      if (!res.ok) {
                        if (res.status === 422 && json.issues) {
                          const issues = json.issues.map((issue: any) => 
                            `${issue.path.join('.')}: ${issue.message}`
                          ).join(', ');
                          throw new Error(`Datos inválidos: ${issues}`);
                        }
                        throw new Error(json?.error ?? "No se pudo crear el producto");
                      }

                      const created = json as AdminProduct;
                      createdProductId = created.id;
                      setProducts((prev) => {
                        const filtered = prev.filter(p => p.id !== created.id);
                        return [created, ...filtered];
                      });
                      setSelectedId(created.id);
                      setCreateStatus({ type: "success", text: "Producto creado correctamente." });
                      setSnackbar({
                        open: true,
                        message: "Producto creado correctamente",
                        severity: "success",
                      });
                    }
                    
                    // Limpiar estados SOLO después de éxito completo
                    createForm.reset(formDefaults());
                    createImages.replace([]);
                    setPendingMainImageFile(null);
                    setPendingGalleryFiles(new Map());
                    console.log("✅ Product created successfully");
                  } catch (error: any) {
                    console.error("❌ Error creating product:", error);
                    setCreateStatus({
                      type: "error",
                      text: error?.message ?? "Error desconocido al crear el producto.",
                    });
                    setSnackbar({
                      open: true,
                      message: error?.message ?? "Error al crear el producto",
                      severity: "error",
                    });

                    // ROLLBACK
                    if (createdProductId) {
                      console.warn(`Rollback: Eliminando producto ${createdProductId}`);
                      try {
                        const deleteRes = await fetch(`/api/products/${createdProductId}`, {
                          method: "DELETE",
                        });
                        if (deleteRes.ok) {
                          console.log(`Rollback exitoso: Producto ${createdProductId} eliminado.`);
                        }
                      } catch (rollbackError: any) {
                        console.error(`Error durante rollback:`, rollbackError);
                      }
                    }
                  }
                },
                (errors) => {
                  console.error("❌ Form validation failed:", errors);
                  const firstErrorKey = Object.keys(errors)[0];
                  const firstError = errors[firstErrorKey as keyof typeof errors];
                  const errorMessage = (firstError as any)?.message || `Error en el campo ${firstErrorKey}`;
                  setCreateStatus({
                    type: "error",
                    text: `Error de validación: ${errorMessage}`,
                  });
                  setSnackbar({
                    open: true,
                    message: errorMessage,
                    severity: "error",
                  });
                }
              )} sx={{ width: "100%" }}>
                {createStatus && (
                  <Alert severity={createStatus.type}>{createStatus.text}</Alert>
                )}

                <Grid container spacing={3} alignItems="stretch" sx={{ mx: 0, width: "100%" }}>
                    {/* Columna izquierda: Campos de texto */}
                    <Grid item xs={12} md={6}>
                      <Paper
                        sx={{
                          p: 3,
                          height: "100%",
                          borderRadius: 4,
                          boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
                          bgcolor: "background.paper",
                        }}
                      >
                        <Stack spacing={2}>
                            <TextField
                              label="Título"
                              size="small"
                              InputLabelProps={{ shrink: !!createForm.watch("name") }}
                              {...createForm.register("name")}
                              error={!!createForm.formState.errors.name}
                              helperText={createForm.formState.errors.name?.message}
                              fullWidth
                            />

                            {/* Slug se genera automáticamente, no se muestra al usuario */}
                            <input
                              type="hidden"
                              {...createForm.register("slug")}
                            />

                            <Controller
                              control={createForm.control}
                              name="categoryId"
                              render={({ field, fieldState }) => (
                                <TextField
                                  select
                                  label="Categoría"
                                  size="small"
                                  value={field.value ?? ""}
                                  onChange={(event) =>
                                    field.onChange(event.target.value || null)
                                  }
                                  onBlur={field.onBlur}
                                  error={!!fieldState.error}
                                  InputLabelProps={{ shrink: !!field.value }}
                                  helperText={
                                    fieldState.error?.message ??
                                    (categoryList.length === 0
                                      ? "No hay categorías registradas"
                                      : "Selecciona una categoría o deja en blanco")
                                  }
                                  fullWidth
                                >
                                  <MenuItem value="">
                                    {categoryList.length === 0
                                      ? "Sin categorías disponibles"
                                      : "Sin categoría"}
                                  </MenuItem>
                                  {categoryList.map((category) => (
                                    <MenuItem key={category.id} value={category.id}>
                                      {category.name}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              )}
                            />

                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <TextField
                                  label="Precio"
                                  type="number"
                                  size="small"
                                  inputProps={{ 
                                    step: "0.01",
                                    style: {
                                      MozAppearance: 'textfield',
                                    }
                                  }}
                                  sx={{
                                    '& input[type=number]': {
                                      MozAppearance: 'textfield',
                                    },
                                    '& input[type=number]::-webkit-outer-spin-button': {
                                      WebkitAppearance: 'none',
                                      margin: 0,
                                    },
                                    '& input[type=number]::-webkit-inner-spin-button': {
                                      WebkitAppearance: 'none',
                                      margin: 0,
                                    },
                                  }}
                                  fullWidth
                                  InputLabelProps={{ 
                                    shrink: (() => {
                                      const value = createForm.watch("price");
                                      // El label sube cuando hay un número válido (incluyendo 0)
                                      return typeof value === 'number' && !isNaN(value);
                                    })()
                                  }}
                                  {...createForm.register("price", { valueAsNumber: true })}
                                  error={!!createForm.formState.errors.price}
                                  helperText={createForm.formState.errors.price?.message}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  label="Stock"
                                  type="number"
                                  size="small"
                                  inputProps={{
                                    style: {
                                      MozAppearance: 'textfield',
                                    }
                                  }}
                                  sx={{
                                    '& input[type=number]': {
                                      MozAppearance: 'textfield',
                                    },
                                    '& input[type=number]::-webkit-outer-spin-button': {
                                      WebkitAppearance: 'none',
                                      margin: 0,
                                    },
                                    '& input[type=number]::-webkit-inner-spin-button': {
                                      WebkitAppearance: 'none',
                                      margin: 0,
                                    },
                                  }}
                                  fullWidth
                                  InputLabelProps={{ 
                                    shrink: (() => {
                                      const value = createForm.watch("stock");
                                      // El label sube cuando hay un número válido (incluyendo 0)
                                      return typeof value === 'number' && !isNaN(value);
                                    })()
                                  }}
                                  {...createForm.register("stock", { valueAsNumber: true })}
                                  error={!!createForm.formState.errors.stock}
                                  helperText={createForm.formState.errors.stock?.message}
                                />
                              </Grid>
                            </Grid>

                            <Controller
                              control={createForm.control}
                              name="isFeatured"
                              render={({ field }) => (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <input
                                    type="checkbox"
                                    id="create-featured"
                                    checked={field.value ?? false}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                  />
                                  <label htmlFor="create-featured" style={{ cursor: "pointer", fontSize: "0.875rem" }}>
                                    Producto destacado (se mostrará en la página principal)
                                  </label>
                                </Box>
                              )}
                            />

                            <TextField
                              label="Descripción"
                              multiline
                              minRows={4}
                              size="small"
                              InputLabelProps={{ shrink: !!createForm.watch("description") }}
                              {...createForm.register("description")}
                              error={!!createForm.formState.errors.description}
                              helperText={createForm.formState.errors.description?.message}
                              fullWidth
                            />
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* Columna derecha: Imágenes */}
                    <Grid item xs={12} md={6}>
                      <Paper
                        sx={{
                          p: 3,
                          height: "100%",
                          borderRadius: 4,
                          boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
                          bgcolor: "background.paper",
                        }}
                      >
                        <Stack spacing={2.5}>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
                                ¿Cómo quieres agregar las imágenes?
                              </Typography>
                              <ToggleButtonGroup
                                value={createMainImageMode}
                                exclusive
                                onChange={(_, value) => {
                                  if (value) setCreateMainImageMode(value);
                                }}
                                size="small"
                              >
                                <ToggleButton value="url">
                                  <LinkIcon sx={{ mr: 0.5 }} fontSize="small" />
                                  Usar URLs
                                </ToggleButton>
                                <ToggleButton value="upload">
                                  <CloudUploadIcon sx={{ mr: 0.5 }} fontSize="small" />
                                  Subir archivos
                                </ToggleButton>
                              </ToggleButtonGroup>
                            </Box>

                            <Paper 
                              variant="outlined" 
                              sx={{ p: 2.5, bgcolor: "rgba(25, 118, 210, 0.04)" }}
                            >
                              <Stack spacing={2}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                  Imagen principal
                                </Typography>

                                <Typography variant="caption" color="text.secondary">
                                  Esta será la imagen destacada del producto
                                </Typography>

                                {createMainImageMode === "url" ? (
                                  <TextField
                                    label="URL de la imagen"
                                    size="small"
                                    InputLabelProps={{ shrink: !!createForm.watch("imageUrl") }}
                                    {...createForm.register("imageUrl")}
                                    error={!!createForm.formState.errors.imageUrl}
                                    helperText={createForm.formState.errors.imageUrl?.message}
                                    fullWidth
                                  />
                                ) : (
                                  <Controller
                                    name="imageUrl"
                                    control={createForm.control}
                                    render={({ field }) => (
                                      <ImageUploadField
                                        mode="single"
                                        value={field.value ? { url: field.value } : undefined}
                                        onChange={(value) => {
                                          const img = value as UploadedImage;
                                          field.onChange(img?.url || "");
                                          // Guardar el archivo File para subirlo después
                                          if (img?.file) {
                                            setPendingMainImageFile(img.file);
                                          }
                                        }}
                                        label="Subir imagen principal"
                                        error={createForm.formState.errors.imageUrl?.message}
                                        deferUpload={true}
                                      />
                                    )}
                                  />
                                )}
                              </Stack>
                            </Paper>

                          <Paper 
                            variant="outlined" 
                            sx={{ p: 2.5, bgcolor: "rgba(156, 39, 176, 0.04)" }}
                          >
                            <Stack spacing={2}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                  Galería de imágenes
                                </Typography>
                                <Chip 
                                  label="Opcional" 
                                  size="small" 
                                  color="default"
                                  sx={{ height: 20, fontSize: "0.7rem" }}
                                />
                                <Chip 
                                  label={`${createImages.fields.length}/5`}
                                  size="small" 
                                  color={createImages.fields.length >= 5 ? "error" : "primary"}
                                  sx={{ height: 20, fontSize: "0.7rem" }}
                                />
                              </Box>

                              <Typography variant="caption" color="text.secondary">
                                {createMainImageMode === "url" 
                                  ? "Agrega hasta 5 imágenes adicionales usando URLs"
                                  : "Sube hasta 5 imágenes adicionales desde tu PC"
                                }
                              </Typography>

                              <Stack spacing={1.5}>
                                {createImages.fields.map((field, index) => {
                                  // Solo mostrar campos para imágenes por URL, no para blobs
                                  if (field.url?.startsWith("blob:")) return null;
                                  
                                  const urlError =
                                    createForm.formState.errors.images?.[index]?.url;
                                  const altError =
                                    createForm.formState.errors.images?.[index]?.alt;
                                  return (
                                    <Paper
                                      key={field.id}
                                      variant="outlined"
                                      sx={{ p: 1.5, bgcolor: "rgba(255,255,255,0.02)" }}
                                    >
                                      <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                          <Typography variant="caption" fontWeight={600}>
                                            Imagen #{index + 1}
                                          </Typography>
                                          <IconButton
                                            edge="end"
                                            size="small"
                                            color="inherit"
                                            onClick={() => createImages.remove(index)}
                                            aria-label="Eliminar imagen"
                                            sx={{ ml: "auto" }}
                                          >
                                            <DeleteOutlineIcon fontSize="small" />
                                          </IconButton>
                                        </Stack>

                                        <TextField
                                          label="URL"
                                          size="small"
                                          InputLabelProps={{ shrink: !!(createForm.watch(`images.${index}.url` as any) ?? "") }}
                                          {...createForm.register(`images.${index}.url` as const)}
                                          error={!!urlError}
                                          helperText={urlError?.message}
                                          fullWidth
                                        />
                                        
                                        <TextField
                                          label="Texto alternativo"
                                          size="small"
                                          InputLabelProps={{ shrink: !!(createForm.watch(`images.${index}.alt` as any) ?? "") }}
                                          {...createForm.register(`images.${index}.alt` as const)}
                                          error={!!altError}
                                          helperText={altError?.message}
                                          fullWidth
                                        />
                                      </Stack>
                                    </Paper>
                                  );
                                })}
                              </Stack>

                              {createMainImageMode === "url" ? (
                                createImages.fields.length < 5 && (
                                  <Button
                                    type="button"
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => createImages.append({ url: "", alt: "" })}
                                    sx={{ alignSelf: "flex-start" }}
                                  >
                                    Agregar otra imagen ({createImages.fields.length}/5)
                                  </Button>
                                )
                              ) : (
                                createImages.fields.length < 5 && (
                                  <Stack spacing={1.5}>
                          <ImageUploadField
                            mode="multiple"
                            value={[]}
                            onChange={(value) => {
                              const uploaded = Array.isArray(value) ? value : [value];
                              const remainingSlots = 5 - createImages.fields.length;
                              const imagesToAdd = uploaded.slice(0, remainingSlots);
                              
                              // Guardar archivos File para subirlos después
                              const newPendingFiles = new Map(pendingGalleryFiles);
                              imagesToAdd.forEach((img, idx) => {
                                if (img.file && img.url) {
                                  newPendingFiles.set(img.url, img.file);
                                }
                                
                                // Generar texto alternativo automáticamente
                                const autoAlt = img.file 
                                  ? `Imagen de galería ${createImages.fields.length + idx + 1} - ${img.file.name.replace(/\.[^/.]+$/, "")}`
                                  : `Imagen de galería ${createImages.fields.length + idx + 1}`;
                                
                                // Agregar imagen a la galería usando append
                                createImages.append({
                                  url: img.url,
                                  alt: autoAlt,
                                });
                              });
                              
                              setPendingGalleryFiles(newPendingFiles);
                            }}
                            label={`Subir archivos (quedan ${5 - createImages.fields.length} espacios)`}
                            deferUpload={true}
                          />
                          
                          {/* Mostrar miniaturas de las imágenes cargadas */}
                          {createImages.fields.some(f => f.url?.startsWith("blob:")) && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                                Imágenes cargadas ({createImages.fields.filter(f => f.url?.startsWith("blob:")).length})
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1.5,
                                  flexWrap: "wrap",
                                  p: 1.5,
                                  bgcolor: "rgba(255,255,255,0.02)",
                                  borderRadius: 1,
                                }}
                              >
                                {createImages.fields.map((field, index) => 
                                  field.url?.startsWith("blob:") && (
                                    <Box
                                      key={field.id}
                                      sx={{
                                        position: "relative",
                                        width: 140,
                                        height: 140,
                                        borderRadius: 1,
                                        overflow: "hidden",
                                        bgcolor: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                      }}
                                    >
                                      <img
                                        src={field.url}
                                        alt={field.alt || `Imagen ${index + 1}`}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                      <Box
                                        sx={{
                                          position: "absolute",
                                          top: 4,
                                          right: 4,
                                          display: "flex",
                                          gap: 0.5,
                                        }}
                                      >
                                        <Chip
                                          label={`#${index + 1}`}
                                          size="small"
                                          sx={{ 
                                            bgcolor: "rgba(0,0,0,0.7)",
                                            color: "white",
                                            height: 20,
                                            fontSize: "0.7rem",
                                          }}
                                        />
                                        <IconButton
                                          size="small"
                                          onClick={() => createImages.remove(index)}
                                          sx={{
                                            bgcolor: "rgba(211, 47, 47, 0.9)",
                                            color: "white",
                                            width: 24,
                                            height: 24,
                                            "&:hover": { bgcolor: "rgba(211, 47, 47, 1)" },
                                          }}
                                        >
                                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  )
                                )}
                              </Box>
                            </Box>
                          )}
                        </Stack>
                      )
                    )}
                    
                    {createImages.fields.length >= 5 && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Has alcanzado el límite de 5 imágenes en la galería
                      </Alert>
                    )}
                            </Stack>
                          </Paper>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={
                      createForm.formState.isSubmitting ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    disabled={createForm.formState.isSubmitting}
                  >
                    Guardar producto
                  </Button>
                </Stack>
              )}

              {(!initialTab || initialTab === "categories") && (
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={initialTab ? 12 : 5}>
                    <Paper sx={{ p: 3 }} elevation={3}>
                  <Stack component="form" spacing={2.5} onSubmit={onCreateCategory}>
                    <Box>
                      <Typography variant="h6" fontWeight={800} gutterBottom>
                        Crear nueva categoría
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Las categorías permiten agrupar y filtrar productos en la
                        tienda. Puedes crear las que necesites y se agregarán
                        inmediatamente a los formularios.
                      </Typography>
                    </Box>

                    {categoryStatus && (
                      <Alert severity={categoryStatus.type}>
                        {categoryStatus.text}
                      </Alert>
                    )}

                    <TextField
                      label="Nombre"
                      InputLabelProps={{ shrink: !!categoryForm.watch("name") }}
                      {...categoryForm.register("name")}
                      error={!!categoryForm.formState.errors.name}
                      helperText={categoryForm.formState.errors.name?.message}
                    />

                    <TextField
                      label="Slug (opcional)"
                      InputLabelProps={{ shrink: !!categoryForm.watch("slug") }}
                      {...categoryForm.register("slug")}
                      error={!!categoryForm.formState.errors.slug}
                      helperText={
                        categoryForm.formState.errors.slug?.message ??
                        "Se generará automáticamente si lo dejas en blanco."
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              size="small"
                              type="button"
                              onClick={createCategorySlugFromName}
                            >
                              Generar
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      type="submit"
                      variant="outlined"
                      startIcon={
                        categoryForm.formState.isSubmitting ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <AddIcon />
                        )
                      }
                      disabled={categoryForm.formState.isSubmitting}
                    >
                      Guardar categoría
                    </Button>
                  </Stack>
                </Paper>
                  </Grid>
                  
                  {/* Lista de categorías existentes */}
                  <Grid item xs={12} lg={initialTab ? 12 : 7}>
                    <Paper sx={{ p: 3 }} elevation={3}>
                      <Typography variant="h6" fontWeight={800} gutterBottom>
                        Categorías existentes
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Edita o elimina las categorías existentes. No puedes eliminar categorías que tienen productos asociados.
                      </Typography>
                      
                      {categoryList.length === 0 ? (
                        <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                          No hay categorías creadas aún.
                        </Typography>
                      ) : (
                        <List dense>
                          {categoryList.map((category) => (
                            <CategoryListItem
                              key={category.id}
                              category={category}
                              onUpdate={async (id, name, slug) => {
                                try {
                                  const res = await fetch(`/api/categories/${id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ name, slug }),
                                  });
                                  const json = await res.json();
                                  if (!res.ok) {
                                    throw new Error(json?.error ?? "Error al actualizar");
                                  }
                                  const updated = json as AdminCategory;
                                  const updatedList = categoryList.map(c => 
                                    c.id === id ? updated : c
                                  ).sort((a, b) => a.name.localeCompare(b.name));
                                  setCategoryList(updatedList);
                                  if (onCategoriesUpdate) {
                                    onCategoriesUpdate(updatedList);
                                  }
                                  setCategoryStatus({
                                    type: "success",
                                    text: "Categoría actualizada correctamente.",
                                  });
                                } catch (error: any) {
                                  setCategoryStatus({
                                    type: "error",
                                    text: error?.message ?? "Error al actualizar la categoría.",
                                  });
                                }
                              }}
                              onDelete={async (id) => {
                                if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
                                try {
                                  const res = await fetch(`/api/categories/${id}`, {
                                    method: "DELETE",
                                  });
                                  const json = await res.json();
                                  if (!res.ok) {
                                    throw new Error(json?.error ?? "Error al eliminar");
                                  }
                                  const updatedList = categoryList.filter(c => c.id !== id);
                                  setCategoryList(updatedList);
                                  if (onCategoriesUpdate) {
                                    onCategoriesUpdate(updatedList);
                                  }
                                  setCategoryStatus({
                                    type: "success",
                                    text: "Categoría eliminada correctamente.",
                                  });
                                } catch (error: any) {
                                  setCategoryStatus({
                                    type: "error",
                                    text: error?.message ?? "Error al eliminar la categoría.",
                                  });
                                }
                              }}
                            />
                          ))}
                        </List>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              )}
          </Box>
        )}

        {(!initialTab || initialTab === "edit") && (
          <Box sx={{ width: "100%", mx: 0, px: 0, overflow: "hidden" }}>
            <Grid container spacing={3} alignItems="stretch" sx={{ mx: 0, width: "100%" }}>
              {/* Card 1: Lista de productos */}
              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 3,
                    height: "100%",
                    borderRadius: 4,
                    boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
                    bgcolor: "background.paper",
                  }}
                >
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={800} gutterBottom>
                        Productos existentes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Busca y selecciona un producto para editarlo
                      </Typography>
                    </Box>
                    
                    <TextField
                      placeholder="Buscar producto por nombre..."
                      size="small"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                    />

                    {filteredProducts.length === 0 ? (
                      <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                        {productSearchQuery.trim() 
                          ? `No se encontraron productos que coincidan con "${productSearchQuery}"` 
                          : "Aún no hay productos creados."}
                      </Typography>
                    ) : (
                      <List dense sx={{ maxHeight: 500, overflowY: "auto" }}>
                        {filteredProducts.map((product) => {
                          const selected = product.id === selectedId;
                          return (
                            <ListItemButton
                              key={product.id}
                              selected={selected}
                              onClick={() => {
                                setDeleteStatus(null);
                                setUpdateStatus(null);
                                setSelectedId(product.id);
                              }}
                              alignItems="flex-start"
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography fontWeight={700}>{product.name}</Typography>
                                    <Chip
                                      size="small"
                                      color={product.stock > 0 ? "success" : "default"}
                                      label={`Stock: ${product.stock}`}
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    Actualizado {formatDate(product.updatedAt)}
                                  </Typography>
                                }
                              />
                            </ListItemButton>
                          );
                        })}
                      </List>
                    )}
                  </Stack>
                </Paper>
              </Grid>

              {/* Card 2: Formulario de editar */}
              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 3,
                    height: "100%",
                    borderRadius: 4,
                    boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
                    bgcolor: "background.paper",
                  }}
                >
                  <Stack component="form" spacing={2.5} onSubmit={onUpdate}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                        justifyContent: "space-between",
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="h6" fontWeight={800}>
                          Editar producto
                        </Typography>
                        {selectedProduct && (
                          <Button
                            component={Link}
                            href={`/products/${selectedProduct.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            endIcon={<OpenInNewIcon fontSize="small" />}
                          >
                            Ver en la tienda
                          </Button>
                        )}
                      </Box>

                      {selectedProduct && (
                        <Button
                          type="button"
                          variant="outlined"
                          color="error"
                          onClick={handleDeleteProduct}
                          startIcon={
                            isDeleting ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <DeleteForeverIcon fontSize="small" />
                            )
                          }
                          disabled={isDeleting}
                          sx={{ width: { xs: "100%", sm: "auto" } }}
                        >
                          Eliminar producto
                        </Button>
                      )}
                    </Box>

                  {deleteStatus && (
                    <Alert severity={deleteStatus.type}>
                      {deleteStatus.text}
                    </Alert>
                  )}

                  {!selectedProduct ? (
                    <Typography color="text.secondary">
                      Selecciona un producto de la lista para editarlo.
                    </Typography>
                  ) : (
                    <>
                      {updateStatus && (
                        <Alert severity={updateStatus.type}>
                          {updateStatus.text}
                        </Alert>
                      )}

                      <Stack spacing={2}>
                        <TextField
                          label="Título"
                          size="small"
                          InputLabelProps={{ shrink: !!editForm.watch("name") }}
                          {...editForm.register("name")}
                          error={!!editForm.formState.errors.name}
                          helperText={editForm.formState.errors.name?.message}
                          fullWidth
                        />

                        <TextField
                          label="Slug"
                          size="small"
                          InputLabelProps={{ shrink: !!editForm.watch("slug") }}
                          {...editForm.register("slug")}
                          error={!!editForm.formState.errors.slug}
                          helperText={
                            editForm.formState.errors.slug?.message ??
                            "Puedes regenerarlo desde el título."
                          }
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Button
                                  size="small"
                                  onClick={editSlugFromName}
                                  type="button"
                                >
                                  Generar
                                </Button>
                              </InputAdornment>
                            ),
                          }}
                          fullWidth
                        />

                        <Controller
                          control={editForm.control}
                          name="categoryId"
                          render={({ field, fieldState }) => (
                            <TextField
                              select
                              label="Categoría"
                              size="small"
                              value={field.value ?? ""}
                              onChange={(event) =>
                                field.onChange(event.target.value || null)
                              }
                              onBlur={field.onBlur}
                              error={!!fieldState.error}
                              InputLabelProps={{ shrink: !!field.value }}
                              helperText={
                                fieldState.error?.message ??
                                (categoryList.length === 0
                                  ? "No hay categorías registradas"
                                  : "Selecciona una categoría o deja en blanco")
                              }
                              fullWidth
                            >
                              <MenuItem value="">
                                {categoryList.length === 0
                                  ? "Sin categorías disponibles"
                                  : "Sin categoría"}
                              </MenuItem>
                              {categoryList.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                  {category.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              label="Precio"
                              type="number"
                              size="small"
                              inputProps={{ 
                                step: "0.01",
                                style: {
                                  MozAppearance: 'textfield',
                                }
                              }}
                              sx={{
                                '& input[type=number]': {
                                  MozAppearance: 'textfield',
                                },
                                '& input[type=number]::-webkit-outer-spin-button': {
                                  WebkitAppearance: 'none',
                                  margin: 0,
                                },
                                '& input[type=number]::-webkit-inner-spin-button': {
                                  WebkitAppearance: 'none',
                                  margin: 0,
                                },
                              }}
                              fullWidth
                              InputLabelProps={{ 
                                shrink: (() => {
                                  const value = editForm.watch("price");
                                  // El label sube cuando hay un número válido (incluyendo 0)
                                  return typeof value === 'number' && !isNaN(value);
                                })()
                              }}
                              {...editForm.register("price", { valueAsNumber: true })}
                              error={!!editForm.formState.errors.price}
                              helperText={editForm.formState.errors.price?.message}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Stock"
                              type="number"
                              size="small"
                              inputProps={{
                                style: {
                                  MozAppearance: 'textfield',
                                }
                              }}
                              sx={{
                                '& input[type=number]': {
                                  MozAppearance: 'textfield',
                                },
                                '& input[type=number]::-webkit-outer-spin-button': {
                                  WebkitAppearance: 'none',
                                  margin: 0,
                                },
                                '& input[type=number]::-webkit-inner-spin-button': {
                                  WebkitAppearance: 'none',
                                  margin: 0,
                                },
                              }}
                              fullWidth
                              InputLabelProps={{ 
                                shrink: (() => {
                                  const value = editForm.watch("stock");
                                  // El label sube cuando hay un número válido (incluyendo 0)
                                  return typeof value === 'number' && !isNaN(value);
                                })()
                              }}
                              {...editForm.register("stock", { valueAsNumber: true })}
                              error={!!editForm.formState.errors.stock}
                              helperText={editForm.formState.errors.stock?.message}
                            />
                          </Grid>
                        </Grid>

                        <Controller
                          control={editForm.control}
                          name="isFeatured"
                          render={({ field }) => (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <input
                                type="checkbox"
                                id="edit-featured"
                                checked={field.value ?? false}
                                onChange={(e) => field.onChange(e.target.checked)}
                                style={{ width: "18px", height: "18px", cursor: "pointer" }}
                              />
                              <label htmlFor="edit-featured" style={{ cursor: "pointer", fontSize: "0.875rem" }}>
                                Producto destacado (se mostrará en la página principal)
                              </label>
                            </Box>
                          )}
                        />

                        <TextField
                          label="Descripción"
                          multiline
                          minRows={4}
                          size="small"
                          InputLabelProps={{ shrink: !!editForm.watch("description") }}
                          {...editForm.register("description")}
                          error={!!editForm.formState.errors.description}
                          helperText={editForm.formState.errors.description?.message}
                          fullWidth
                        />

                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          size="large"
                          startIcon={<SaveIcon />}
                          disabled={editForm.formState.isSubmitting}
                          sx={{ mt: 1 }}
                        >
                          {editForm.formState.isSubmitting
                            ? "Guardando..."
                            : "Guardar cambios"}
                        </Button>
                      </Stack>
                    </>
                  )}
                </Stack>
              </Paper>
            </Grid>

            {/* Card 3: Imágenes */}
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: 4,
                  boxShadow: "0 22px 45px rgba(0,0,0,0.35)",
                  bgcolor: "background.paper",
                }}
              >
                {!selectedProduct ? (
                  <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                    Selecciona un producto para gestionar sus imágenes
                  </Typography>
                ) : (
                  <Stack spacing={2.5}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
                        ¿Cómo quieres agregar las imágenes?
                      </Typography>
                      <ToggleButtonGroup
                        value={editMainImageMode}
                        exclusive
                        onChange={(_, value) => {
                          if (value) setEditMainImageMode(value);
                        }}
                        size="small"
                      >
                        <ToggleButton value="url">
                          <LinkIcon sx={{ mr: 0.5 }} fontSize="small" />
                          Usar URLs
                        </ToggleButton>
                        <ToggleButton value="upload">
                          <CloudUploadIcon sx={{ mr: 0.5 }} fontSize="small" />
                          Subir archivos
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    <Paper 
                      variant="outlined" 
                      sx={{ p: 2.5, bgcolor: "rgba(25, 118, 210, 0.04)" }}
                    >
                      <Stack spacing={2}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Imagen principal
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          Esta será la imagen destacada del producto
                        </Typography>

                        {editMainImageMode === "url" ? (
                          <TextField
                            label="URL de la imagen"
                            size="small"
                            InputLabelProps={{ shrink: !!editForm.watch("imageUrl") }}
                            {...editForm.register("imageUrl")}
                            error={!!editForm.formState.errors.imageUrl}
                            helperText={editForm.formState.errors.imageUrl?.message}
                            fullWidth
                          />
                        ) : (
                          <Controller
                            name="imageUrl"
                            control={editForm.control}
                            render={({ field }) => (
                              <ImageUploadField
                                mode="single"
                                value={field.value ? { url: field.value } : undefined}
                                onChange={(value) => {
                                  const img = value as UploadedImage;
                                  field.onChange(img?.url || "");
                                  // Guardar el archivo File para subirlo después
                                  if (img?.file) {
                                    setPendingEditMainImageFile(img.file);
                                  }
                                }}
                                productId={selectedProduct?.id}
                                label="Subir imagen principal"
                                error={editForm.formState.errors.imageUrl?.message}
                                deferUpload={true}
                              />
                            )}
                          />
                        )}
                      </Stack>
                    </Paper>

                    <Paper 
                      variant="outlined" 
                      sx={{ p: 2.5, bgcolor: "rgba(156, 39, 176, 0.04)" }}
                    >
                      <Stack spacing={2}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            Galería de imágenes
                          </Typography>
                          <Chip 
                            label="Opcional" 
                            size="small" 
                            color="default"
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                          <Chip 
                            label={`${editImages.fields.length}/5`}
                            size="small" 
                            color={editImages.fields.length >= 5 ? "error" : "primary"}
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                            {editMainImageMode === "url" 
                              ? "Agrega hasta 5 imágenes adicionales usando URLs"
                              : "Sube hasta 5 imágenes adicionales desde tu PC"
                            }
                          </Typography>

                        {/* Galería de imágenes mostrada horizontalmente */}
                        {editImages.fields.length > 0 && (
                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{
                              flexWrap: "wrap",
                              gap: 1.5,
                            }}
                          >
                            {editImages.fields.map((field, index) => {
                              const urlError =
                                editForm.formState.errors.images?.[index]?.url;
                              const showPreview = shouldShowImagePreview(field.url);
                              
                              if (showPreview) {
                                return (
                                  <Box
                                    key={field.id}
                                    sx={{
                                      width: 160,
                                      height: 160,
                                      position: "relative",
                                      borderRadius: 1,
                                      overflow: "hidden",
                                      bgcolor: "rgba(255,255,255,0.05)",
                                      border: "1px solid",
                                      borderColor: "divider",
                                    }}
                                  >
                                    <img
                                      src={field.url}
                                      alt={field.alt || `Preview ${index + 1}`}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                    <Box
                                      sx={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                      }}
                                    >
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => editImages.remove(index)}
                                        sx={{
                                          bgcolor: "rgba(255,255,255,0.9)",
                                          "&:hover": {
                                            bgcolor: "rgba(255,255,255,1)",
                                          },
                                          boxShadow: 2,
                                        }}
                                        aria-label="Eliminar imagen"
                                      >
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                    <Chip
                                      size="small"
                                      label={`#${index + 1}`}
                                      sx={{
                                        position: "absolute",
                                        bottom: 4,
                                        left: 4,
                                        bgcolor: "rgba(0,0,0,0.6)",
                                        color: "white",
                                      }}
                                    />
                                  </Box>
                                );
                              } else {
                                return (
                                  <TextField
                                    key={field.id}
                                    label={`URL Imagen ${index + 1}`}
                                    size="small"
                                    InputLabelProps={{ shrink: !!(editForm.watch(`images.${index}.url` as any) ?? "") }}
                                    {...editForm.register(`images.${index}.url` as const)}
                                    error={!!urlError}
                                    helperText={urlError?.message}
                                    sx={{ width: 200 }}
                                  />
                                );
                              }
                            })}
                          </Stack>
                        )}

                        {editMainImageMode === "url" ? (
                          editImages.fields.length < 5 && (
                            <Button
                              type="button"
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => editImages.append({ url: "", alt: "" })}
                              sx={{ alignSelf: "flex-start" }}
                            >
                              Agregar otra imagen ({editImages.fields.length}/5)
                            </Button>
                          )
                        ) : (
                          editImages.fields.length < 5 && (
                            <Stack spacing={2}>
                              <ImageUploadField
                                mode="multiple"
                                value={[]}
                                onChange={(value) => {
                                  const uploaded = Array.isArray(value) ? value : [value];
                                  const remainingSlots = 5 - editImages.fields.length;
                                  const imagesToAdd = uploaded.slice(0, remainingSlots);
                                  
                                  // Guardar archivos File para subirlos después
                                  const newPendingFiles = new Map(pendingEditGalleryFiles);
                                  imagesToAdd.forEach((img, idx) => {
                                    if (img.file && img.url) {
                                      newPendingFiles.set(img.url, img.file);
                                    }
                                    
                                    // Generar texto alternativo automáticamente
                                    const autoAlt = img.file 
                                      ? `Imagen de galería ${editImages.fields.length + idx + 1} - ${img.file.name.replace(/\.[^/.]+$/, "")}`
                                      : `Imagen de galería ${editImages.fields.length + idx + 1}`;
                                    
                                    editImages.append({
                                      url: img.url,
                                      alt: autoAlt,
                                    });
                                  });
                                  
                                  setPendingEditGalleryFiles(newPendingFiles);
                                }}
                                productId={selectedProduct?.id}
                                label={`Subir archivos (quedan ${5 - editImages.fields.length} espacios)`}
                                deferUpload={true}
                              />
                              
                              {/* Mostrar miniaturas de las imágenes cargadas */}
                              {editImages.fields.some(f => f.url?.startsWith("blob:")) && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                                    Imágenes cargadas ({editImages.fields.filter(f => f.url?.startsWith("blob:")).length})
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 1.5,
                                      flexWrap: "wrap",
                                      p: 1.5,
                                      bgcolor: "rgba(255,255,255,0.02)",
                                      borderRadius: 1,
                                    }}
                                  >
                                    {editImages.fields.map((field, index) => 
                                      field.url?.startsWith("blob:") && (
                                        <Box
                                          key={field.id}
                                          sx={{
                                            position: "relative",
                                            width: 140,
                                            height: 140,
                                            borderRadius: 1,
                                            overflow: "hidden",
                                            bgcolor: "rgba(255,255,255,0.05)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                          }}
                                        >
                                          <img
                                            src={field.url}
                                            alt={field.alt || `Imagen ${index + 1}`}
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                            }}
                                          />
                                          <Box
                                            sx={{
                                              position: "absolute",
                                              top: 4,
                                              right: 4,
                                              display: "flex",
                                              gap: 0.5,
                                            }}
                                          >
                                            <Chip
                                              label={`#${index + 1}`}
                                              size="small"
                                              sx={{ 
                                                bgcolor: "rgba(0,0,0,0.7)",
                                                color: "white",
                                                height: 20,
                                                fontSize: "0.7rem",
                                              }}
                                            />
                                            <IconButton
                                              size="small"
                                              onClick={() => editImages.remove(index)}
                                              sx={{
                                                bgcolor: "rgba(211, 47, 47, 0.9)",
                                                color: "white",
                                                width: 24,
                                                height: 24,
                                                "&:hover": { bgcolor: "rgba(211, 47, 47, 1)" },
                                              }}
                                            >
                                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                          </Box>
                                        </Box>
                                      )
                                    )}
                                  </Box>
                                </Box>
                              )}
                            </Stack>
                          )
                        )}
                        
                        {editImages.fields.length >= 5 && (
                          <Alert severity="info">
                            Has alcanzado el límite de 5 imágenes en la galería
                          </Alert>
                        )}
                      </Stack>
                    </Paper>
                  </Stack>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
        )}
      </Stack>
  );

  const contentWithSnackbar = (
    <>
      {content}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );

  if (initialTab) {
    return <Box sx={{}}>{contentWithSnackbar}</Box>;
  }

  return <Container sx={{ py: 6 }}>{contentWithSnackbar}</Container>;
}
