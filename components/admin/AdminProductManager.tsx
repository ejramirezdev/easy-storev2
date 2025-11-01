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
  Grid,
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SaveIcon from "@mui/icons-material/Save";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
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

const formDefaults = (): ProductInput => ({
  name: "",
  slug: "",
  description: "",
  price: 0,
  stock: 0,
  imageUrl: "",
  images: [],
  categoryId: null,
});

type FormValues = ProductInput;
type CategoryFormValues = CategoryInput;

type StatusMessage = { type: "success" | "error"; text: string } | null;

type Props = {
  initialProducts: AdminProduct[];
  adminName: string;
  categories: AdminCategory[];
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
    images: product.images.map((img, index) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? "",
      sortOrder: index,
    })),
  };
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
    imageUrl: typeof values.imageUrl === "string" ? values.imageUrl.trim() : values.imageUrl,
    categoryId,
    images: (values.images ?? []).map((img, index) => ({
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
}: Props) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [createStatus, setCreateStatus] = useState<StatusMessage>(null);
  const [updateStatus, setUpdateStatus] = useState<StatusMessage>(null);
  const [deleteStatus, setDeleteStatus] = useState<StatusMessage>(null);
  const [categoryStatus, setCategoryStatus] = useState<StatusMessage>(null);
  const [categoryList, setCategoryList] = useState<AdminCategory[]>(() => [
    ...categories,
  ]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(
    initialProducts[0]?.id ?? null
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId]
  );

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
  }, [selectedProduct, resetEditForm]);

  const createSlugFromName = () => {
    const name = createForm.getValues("name");
    if (!name) return;
    createForm.setValue("slug", slugify(name), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

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

  const onCreate = createForm.handleSubmit(async (values) => {
    setCreateStatus(null);
    const payload = normalizePayload(values);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "No se pudo crear el producto");
      }

      const created = json as AdminProduct;
      setProducts((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setCreateStatus({ type: "success", text: "Producto creado correctamente." });
      createForm.reset(formDefaults());
      createImages.replace([]);
    } catch (error: any) {
      setCreateStatus({
        type: "error",
        text: error?.message ?? "Error desconocido al crear el producto.",
      });
    }
  });

  const onUpdate = editForm.handleSubmit(async (values) => {
    if (!selectedProduct) return;
    setUpdateStatus(null);
    const payload = normalizePayload(values);

    try {
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
    } catch (error: any) {
      setUpdateStatus({
        type: "error",
        text: error?.message ?? "Error desconocido al actualizar el producto.",
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
      setCategoryList((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
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

  return (
    <Container sx={{ py: 6 }}>
      <Stack spacing={4}>
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

            <Button
              component={Link}
              href="/"
              variant="outlined"
              color="secondary"
            >
              Volver a la tienda
            </Button>
          </Stack>
        </Box>

        <Alert severity="info">
          Asegúrate de usar URLs accesibles públicamente por el momento. Cuando
          integremos buckets de S3 bastará con reemplazar el origen de las
          imágenes sin cambiar esta interfaz.
        </Alert>

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} lg={5}>
            <Stack spacing={3} sx={{ height: "100%" }}>
              <Paper sx={{ p: 3 }} elevation={3}>
                <Stack component="form" spacing={2.5} onSubmit={onCreate}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} gutterBottom>
                      Crear nuevo producto
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completa la información básica y agrega URLs de imágenes si
                      ya las tienes disponibles.
                    </Typography>
                  </Box>

                  {createStatus && (
                    <Alert severity={createStatus.type}>{createStatus.text}</Alert>
                  )}

                  <TextField
                    label="Título"
                    {...createForm.register("name")}
                    error={!!createForm.formState.errors.name}
                    helperText={createForm.formState.errors.name?.message}
                    fullWidth
                  />

                  <TextField
                    label="Slug"
                    {...createForm.register("slug")}
                    error={!!createForm.formState.errors.slug}
                    helperText={
                      createForm.formState.errors.slug?.message ??
                      "Se generará automáticamente si lo dejas vacío."
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            size="small"
                            onClick={createSlugFromName}
                            type="button"
                          >
                            Generar
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Controller
                    control={createForm.control}
                    name="categoryId"
                    render={({ field, fieldState }) => (
                      <TextField
                        select
                        label="Categoría"
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(event.target.value || null)
                        }
                        onBlur={field.onBlur}
                        error={!!fieldState.error}
                        helperText={
                          fieldState.error?.message ??
                          (categoryList.length === 0
                            ? "No hay categorías registradas"
                            : "Selecciona una categoría o deja en blanco")
                        }
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
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Precio"
                        type="number"
                        inputProps={{ step: "0.01" }}
                        fullWidth
                        {...createForm.register("price", { valueAsNumber: true })}
                        error={!!createForm.formState.errors.price}
                        helperText={createForm.formState.errors.price?.message}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Stock"
                        type="number"
                        fullWidth
                        {...createForm.register("stock", { valueAsNumber: true })}
                        error={!!createForm.formState.errors.stock}
                        helperText={createForm.formState.errors.stock?.message}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="Descripción"
                    multiline
                    minRows={4}
                    {...createForm.register("description")}
                    error={!!createForm.formState.errors.description}
                    helperText={createForm.formState.errors.description?.message}
                  />

                  <TextField
                    label="Imagen principal (URL)"
                    {...createForm.register("imageUrl")}
                    error={!!createForm.formState.errors.imageUrl}
                    helperText={createForm.formState.errors.imageUrl?.message}
                  />

                  <Stack spacing={1.5}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Galería
                      </Typography>
                      <Chip label="Opcional" size="small" color="default" />
                    </Box>

                    {createImages.fields.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Puedes agregar varias imágenes adicionales. Usa URLs
                        temporales y más adelante podrás migrarlas a S3.
                      </Typography>
                    )}

                    <Stack spacing={1.5}>
                      {createImages.fields.map((field, index) => {
                        const urlError =
                          createForm.formState.errors.images?.[index]?.url;
                        const altError =
                          createForm.formState.errors.images?.[index]?.alt;
                        return (
                          <Paper
                            key={field.id}
                            variant="outlined"
                            sx={{ p: 2, bgcolor: "rgba(255,255,255,0.02)" }}
                          >
                            <Stack spacing={1.5}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography fontWeight={600}>
                                  Imagen #{index + 1}
                                </Typography>
                                <IconButton
                                  edge="end"
                                  size="small"
                                  color="inherit"
                                  onClick={() => createImages.remove(index)}
                                  aria-label="Eliminar imagen"
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Stack>

                              <TextField
                                label="URL"
                                {...createForm.register(`images.${index}.url` as const)}
                                error={!!urlError}
                                helperText={urlError?.message}
                              />
                              <TextField
                                label="Texto alternativo"
                                {...createForm.register(`images.${index}.alt` as const)}
                                error={!!altError}
                                helperText={altError?.message}
                              />
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>

                    <Button
                      type="button"
                      startIcon={<AddIcon />}
                      onClick={() => createImages.append({ url: "", alt: "" })}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Agregar imagen
                    </Button>
                  </Stack>

                  <Divider />

                  <Button
                    type="submit"
                    variant="contained"
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
              </Paper>

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
                    {...categoryForm.register("name")}
                    error={!!categoryForm.formState.errors.name}
                    helperText={categoryForm.formState.errors.name?.message}
                  />

                  <TextField
                    label="Slug (opcional)"
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
            </Stack>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Stack spacing={2} sx={{ height: "100%" }}>
              <Paper sx={{ p: 2 }} elevation={2}>
                <Typography variant="h6" fontWeight={800} gutterBottom>
                  Productos existentes
                </Typography>
                {products.length === 0 ? (
                  <Typography color="text.secondary">
                    Aún no hay productos creados.
                  </Typography>
                ) : (
                  <List dense sx={{ maxHeight: 260, overflowY: "auto" }}>
                    {products.map((product) => {
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
              </Paper>

              <Paper sx={{ p: 3, flex: 1 }} elevation={3}>
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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

                      <TextField
                        label="Título"
                        {...editForm.register("name")}
                        error={!!editForm.formState.errors.name}
                        helperText={editForm.formState.errors.name?.message}
                      />

                      <TextField
                        label="Slug"
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
                      />

                      <Controller
                        control={editForm.control}
                        name="categoryId"
                        render={({ field, fieldState }) => (
                          <TextField
                            select
                            label="Categoría"
                            value={field.value ?? ""}
                            onChange={(event) =>
                              field.onChange(event.target.value || null)
                            }
                            onBlur={field.onBlur}
                            error={!!fieldState.error}
                            helperText={
                              fieldState.error?.message ??
                              (categoryList.length === 0
                                ? "No hay categorías registradas"
                                : "Selecciona una categoría o deja en blanco")
                            }
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
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Precio"
                            type="number"
                            inputProps={{ step: "0.01" }}
                            fullWidth
                            {...editForm.register("price", { valueAsNumber: true })}
                            error={!!editForm.formState.errors.price}
                            helperText={editForm.formState.errors.price?.message}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Stock"
                            type="number"
                            fullWidth
                            {...editForm.register("stock", { valueAsNumber: true })}
                            error={!!editForm.formState.errors.stock}
                            helperText={editForm.formState.errors.stock?.message}
                          />
                        </Grid>
                      </Grid>

                      <TextField
                        label="Descripción"
                        multiline
                        minRows={4}
                        {...editForm.register("description")}
                        error={!!editForm.formState.errors.description}
                        helperText={editForm.formState.errors.description?.message}
                      />

                      <TextField
                        label="Imagen principal (URL)"
                        {...editForm.register("imageUrl")}
                        error={!!editForm.formState.errors.imageUrl}
                        helperText={editForm.formState.errors.imageUrl?.message}
                      />

                      <Stack spacing={1.5}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            Galería
                          </Typography>
                          <Chip label="Opcional" size="small" color="default" />
                        </Box>

                        <Stack spacing={1.5}>
                          {editImages.fields.map((field, index) => {
                            const urlError =
                              editForm.formState.errors.images?.[index]?.url;
                            const altError =
                              editForm.formState.errors.images?.[index]?.alt;
                            return (
                              <Paper
                                key={field.id}
                                variant="outlined"
                                sx={{ p: 2, bgcolor: "rgba(255,255,255,0.02)" }}
                              >
                                <Stack spacing={1.5}>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Typography fontWeight={600}>
                                      Imagen #{index + 1}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={`Orden ${index + 1}`}
                                      color="primary"
                                      variant="outlined"
                                    />
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      color="inherit"
                                      onClick={() => editImages.remove(index)}
                                      aria-label="Eliminar imagen"
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>

                                  <TextField
                                    label="URL"
                                    {...editForm.register(`images.${index}.url` as const)}
                                    error={!!urlError}
                                    helperText={urlError?.message}
                                  />
                                  <TextField
                                    label="Texto alternativo"
                                    {...editForm.register(`images.${index}.alt` as const)}
                                    error={!!altError}
                                    helperText={altError?.message}
                                  />
                                </Stack>
                              </Paper>
                            );
                          })}
                        </Stack>

                        <Button
                          type="button"
                          startIcon={<AddIcon />}
                          onClick={() => editImages.append({ url: "", alt: "" })}
                          sx={{ alignSelf: "flex-start" }}
                        >
                          Agregar imagen
                        </Button>
                      </Stack>

                      <Divider />

                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={
                          editForm.formState.isSubmitting ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        disabled={editForm.formState.isSubmitting}
                      >
                        Guardar cambios
                      </Button>
                    </>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
