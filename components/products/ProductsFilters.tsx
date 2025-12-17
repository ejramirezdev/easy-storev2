"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Drawer,
  IconButton,
  Button,
  Typography,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type ProductsFiltersProps = {
  categories: Category[];
};

export default function ProductsFilters({ categories }: ProductsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentCat = searchParams.get("cat") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);
  const [categoryInput, setCategoryInput] = useState(currentCat);

  const isApplyingRef = useRef(false);
  const hasRestoredRef = useRef(false);

  // Guardar filtros en sessionStorage cuando cambian en la URL
  useEffect(() => {
    if (typeof window !== "undefined" && pathname === "/products") {
      const filters = {
        search: currentSearch,
        minPrice: currentMinPrice,
        maxPrice: currentMaxPrice,
        cat: currentCat,
        sort: currentSort,
      };
      sessionStorage.setItem("productFilters", JSON.stringify(filters));
    }
  }, [
    currentSearch,
    currentMinPrice,
    currentMaxPrice,
    currentCat,
    currentSort,
    pathname,
  ]);

  // Restaurar filtros desde sessionStorage solo al montar el componente
  // Los componentes de navegación (BackToProductsButton, ModalContainer) manejan
  // la restauración cuando el usuario navega desde un producto
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      pathname === "/products" &&
      !hasRestoredRef.current
    ) {
      const savedFilters = sessionStorage.getItem("productFilters");
      if (savedFilters) {
        try {
          const filters = JSON.parse(savedFilters);
          // Solo restaurar si la URL actual no tiene filtros
          const hasNoFilters =
            !currentSearch &&
            !currentMinPrice &&
            !currentMaxPrice &&
            !currentCat &&
            currentSort === "newest";

          if (hasNoFilters) {
            hasRestoredRef.current = true;
            const params = new URLSearchParams();
            if (filters.search) params.set("search", filters.search);
            if (filters.minPrice) params.set("minPrice", filters.minPrice);
            if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
            if (filters.cat) params.set("cat", filters.cat);
            if (filters.sort && filters.sort !== "newest")
              params.set("sort", filters.sort);

            const query = params.toString();
            if (query) {
              router.replace(`/products?${query}`);
            }
          } else {
            // Si ya hay filtros en la URL, marcar como restaurado
            hasRestoredRef.current = true;
          }
        } catch (e) {
          console.error("Error parsing saved filters:", e);
        }
      } else {
        hasRestoredRef.current = true;
      }
    }
  }, []); // Solo ejecutar una vez al montar

  // Resetear el flag cuando cambiamos de ruta
  useEffect(() => {
    if (pathname !== "/products") {
      hasRestoredRef.current = false;
    }
  }, [pathname]);

  // Sincronizar estados locales con URL cuando cambia
  useEffect(() => {
    // No sincronizar si estamos en proceso de aplicar filtros
    if (isApplyingRef.current) {
      isApplyingRef.current = false;
      return;
    }

    // Sincronizar siempre con los valores actuales de la URL
    setSearchInput(currentSearch);
    setMinPriceInput(currentMinPrice);
    setMaxPriceInput(currentMaxPrice);
    setCategoryInput(currentCat);
  }, [currentSearch, currentMinPrice, currentMaxPrice, currentCat]);

  // Sincronizar estados cuando se abre el drawer (leer directamente de searchParams)
  useEffect(() => {
    if (drawerOpen) {
      // Leer directamente de searchParams para asegurar valores actualizados
      const minPrice = searchParams.get("minPrice") || "";
      const maxPrice = searchParams.get("maxPrice") || "";
      const cat = searchParams.get("cat") || "";
      const search = searchParams.get("search") || "";

      setMinPriceInput(minPrice);
      setMaxPriceInput(maxPrice);
      setCategoryInput(cat);
      setSearchInput(search);
    }
  }, [drawerOpen, searchParams]);

  const buildUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Resetear página cuando cambian los filtros
    params.delete("page");

    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  };

  const handleSearch = (value: string) => {
    router.push(buildUrl({ search: value }));
  };

  const handleSortChange = (value: string) => {
    router.push(buildUrl({ sort: value }));
  };

  const handleApplyFilters = () => {
    // Marcar que estamos aplicando filtros para evitar sobrescritura en useEffect
    isApplyingRef.current = true;

    // Preservar todos los filtros actuales y actualizar solo los del drawer
    const params = new URLSearchParams(searchParams.toString());

    // Actualizar/eliminar precio mínimo
    if (minPriceInput) {
      params.set("minPrice", minPriceInput);
    } else {
      params.delete("minPrice");
    }

    // Actualizar/eliminar precio máximo
    if (maxPriceInput) {
      params.set("maxPrice", maxPriceInput);
    } else {
      params.delete("maxPrice");
    }

    // Actualizar/eliminar categoría
    if (categoryInput) {
      params.set("cat", categoryInput);
    } else {
      params.delete("cat");
    }

    // Resetear página
    params.delete("page");

    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
    setDrawerOpen(false);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    setCategoryInput("");
    // Limpiar sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("productFilters");
    }
    // Resetear el flag de restauración
    hasRestoredRef.current = false;
    router.push("/products");
    setDrawerOpen(false);
  };

  const hasActiveFilters =
    currentSearch ||
    currentMinPrice ||
    currentMaxPrice ||
    currentCat ||
    (currentSort && currentSort !== "newest");

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        {/* Barra de búsqueda */}
        <TextField
          placeholder="Buscar productos..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch(searchInput);
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchInput("");
                    handleSearch("");
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          size="small"
          fullWidth
          sx={{
            background:
              "linear-gradient(135deg, rgba(113,0,150,0.35) 0%, rgba(16,0,50,0.45) 100%)",
            borderRadius: 2,
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": {
                borderColor: "rgba(133,20,197,0.6)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "rgba(133,20,197,0.8)",
              },
            },
          }}
        />

        {/* Ordenar por */}
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select
            value={currentSort}
            label="Ordenar por"
            onChange={(e) => handleSortChange(e.target.value)}
            sx={{
              background:
                "linear-gradient(135deg, rgba(113,0,150,0.35) 0%, rgba(16,0,50,0.45) 100%)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, rgba(113,0,150,0.45) 0%, rgba(16,0,50,0.55) 100%)",
              },
            }}
          >
            <MenuItem value="newest">Más recientes</MenuItem>
            <MenuItem value="featured">Destacados</MenuItem>
            <MenuItem value="price_asc">Precio: menor a mayor</MenuItem>
            <MenuItem value="price_desc">Precio: mayor a menor</MenuItem>
            <MenuItem value="name_asc">Nombre: A-Z</MenuItem>
            <MenuItem value="name_desc">Nombre: Z-A</MenuItem>
          </Select>
        </FormControl>

        {/* Botón de filtros */}
        <Button
          variant="contained"
          startIcon={<FilterListIcon />}
          onClick={() => setDrawerOpen(true)}
          sx={{
            minWidth: { xs: "100%", sm: 180 },
            background:
              "linear-gradient(135deg, rgba(113,0,150,0.68) 0%, rgba(16,0,50,0.9) 100%)",
            boxShadow: "0 4px 15px rgba(113,0,150,0.4)",
            "&:hover": {
              background:
                "linear-gradient(135deg, rgba(133,20,197,0.75) 0%, rgba(16,0,50,0.95) 100%)",
              boxShadow: "0 6px 20px rgba(113,0,150,0.5)",
            },
          }}
        >
          Filtros {hasActiveFilters && "●"}
        </Button>

        {/* Botón Restablecer */}
        {hasActiveFilters && (
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleClearFilters}
            sx={{
              minWidth: { xs: "100%", sm: 140 },
              borderColor: "rgba(133,20,197,0.6)",
              color: "rgba(133,20,197,1)",
              "&:hover": {
                borderColor: "rgba(133,20,197,0.8)",
                bgcolor: "rgba(113,0,150,0.15)",
              },
            }}
          >
            Restablecer
          </Button>
        )}
      </Stack>

      {/* Drawer de filtros */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            background:
              "linear-gradient(135deg, rgba(37,0,76,0.95) 0%, rgba(12,0,60,0.98) 45%, rgba(5,5,6,1) 90%)",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "85vh",
            boxShadow: "0 -10px 40px rgba(113,0,150,0.4)",
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h6" fontWeight={700}>
              Filtros de búsqueda
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Stack spacing={3}>
            {/* Categorías */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Categoría
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip
                  label="Todas"
                  clickable
                  onClick={() => setCategoryInput("")}
                  variant={!categoryInput ? "filled" : "outlined"}
                  sx={{
                    bgcolor: !categoryInput
                      ? "rgba(133,20,197,0.6)"
                      : "transparent",
                    borderColor: "rgba(133,20,197,0.4)",
                    "&:hover": {
                      bgcolor: !categoryInput
                        ? "rgba(133,20,197,0.7)"
                        : "rgba(133,20,197,0.2)",
                    },
                  }}
                />
                {categories.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    clickable
                    onClick={() => setCategoryInput(cat.slug)}
                    variant={categoryInput === cat.slug ? "filled" : "outlined"}
                    sx={{
                      bgcolor:
                        categoryInput === cat.slug
                          ? "rgba(133,20,197,0.6)"
                          : "transparent",
                      borderColor: "rgba(133,20,197,0.4)",
                      "&:hover": {
                        bgcolor:
                          categoryInput === cat.slug
                            ? "rgba(133,20,197,0.7)"
                            : "rgba(133,20,197,0.2)",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Rango de precios */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Rango de precio
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Precio mínimo"
                  value={minPriceInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setMinPriceInput(value);
                    }
                  }}
                  fullWidth
                  placeholder="0.00"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      background:
                        "linear-gradient(135deg, rgba(113,0,150,0.25) 0%, rgba(16,0,50,0.35) 100%)",
                    },
                  }}
                />
                <TextField
                  label="Precio máximo"
                  value={maxPriceInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setMaxPriceInput(value);
                    }
                  }}
                  fullWidth
                  placeholder="0.00"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      background:
                        "linear-gradient(135deg, rgba(113,0,150,0.25) 0%, rgba(16,0,50,0.35) 100%)",
                    },
                  }}
                />
              </Stack>
            </Box>

            {/* Botones */}
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              fullWidth
              size="large"
              sx={{
                background:
                  "linear-gradient(135deg, rgba(113,0,150,0.68) 0%, rgba(16,0,50,0.9) 100%)",
                boxShadow: "0 4px 15px rgba(113,0,150,0.4)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, rgba(133,20,197,0.75) 0%, rgba(16,0,50,0.95) 100%)",
                  boxShadow: "0 6px 20px rgba(113,0,150,0.5)",
                },
              }}
            >
              Aplicar filtros
            </Button>

            {hasActiveFilters && (
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleClearFilters}
                fullWidth
                sx={{
                  borderColor: "rgba(133,20,197,0.6)",
                  color: "rgba(133,20,197,1)",
                  "&:hover": {
                    borderColor: "rgba(133,20,197,0.8)",
                    bgcolor: "rgba(113,0,150,0.15)",
                  },
                }}
              >
                Restablecer filtros
              </Button>
            )}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
