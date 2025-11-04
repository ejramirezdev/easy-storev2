"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
} from "@mui/material";
import Link from "next/link";
import AdminProductManager from "./AdminProductManager";
import AdminPayboxSettings from "./AdminPayboxSettings";
import type { AdminCategory, AdminProduct } from "@/lib/products/types";

type AdminTabsProps = {
  products: AdminProduct[];
  categories: AdminCategory[];
  adminName: string;
};

type TabValue = "create" | "edit" | "categories" | "orders" | "paybox";

export default function AdminTabs({
  products,
  categories,
  adminName,
}: AdminTabsProps) {
  const [currentTab, setCurrentTab] = useState<TabValue>("create");

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Paper sx={{ bgcolor: "background.paper" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 64,
            },
          }}
        >
          <Tab label="Crear producto" value="create" />
          <Tab label="Editar productos" value="edit" />
          <Tab label="Editar categorías" value="categories" />
          <Tab label="Órdenes" value="orders" />
          <Tab label="Configuración de Paybox" value="paybox" />
        </Tabs>
      </Box>

      <Box sx={{ p: 3 }}>
        {currentTab === "create" && (
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Crear nuevo producto
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Completa el formulario para agregar un nuevo producto a la tienda.
            </Typography>
            <AdminProductManager
              initialProducts={products}
              categories={categories}
              adminName={adminName}
              initialTab="create"
            />
          </Box>
        )}

        {currentTab === "edit" && (
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Editar productos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Selecciona un producto de la lista para editarlo o eliminarlo.
            </Typography>
            <AdminProductManager
              initialProducts={products}
              categories={categories}
              adminName={adminName}
              initialTab="edit"
            />
          </Box>
        )}

        {currentTab === "categories" && (
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Editar categorías
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Gestiona las categorías de productos. Puedes crear nuevas
              categorías o editar las existentes.
            </Typography>
            <AdminProductManager
              initialProducts={products}
              categories={categories}
              adminName={adminName}
              initialTab="categories"
            />
          </Box>
        )}

        {currentTab === "orders" && (
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Gestión de órdenes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Administra las órdenes de los clientes, cambia estados y revisa
              comprobantes de pago.
            </Typography>
            <Link href="/admin/orders" legacyBehavior passHref>
              <Button
                component="a"
                variant="contained"
                color="secondary"
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Ver gestión de órdenes
              </Button>
            </Link>
          </Box>
        )}

        {currentTab === "paybox" && (
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Configuración de Paybox
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configura los parámetros de la pasarela de pagos PLUX/Paybox.
            </Typography>
            <AdminPayboxSettings />
          </Box>
        )}
      </Box>
    </Paper>
  );
}

