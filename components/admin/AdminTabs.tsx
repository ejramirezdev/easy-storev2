"use client";

import { useState, useCallback } from "react";
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
import AdminPayphoneSettings from "./AdminPayphoneSettings";
import AdminBankAccountsManager from "./AdminBankAccountsManager";
import AdminCouponsManager from "./AdminCouponsManager";
import AdminUsersManager from "./AdminUsersManager";
import type { AdminCategory, AdminProduct } from "@/lib/products/types";

type AdminTabsProps = {
  products: AdminProduct[];
  categories: AdminCategory[];
  adminName: string;
  canAccessPayphone: boolean;
  canManageUsers: boolean;
};

type TabValue = "create" | "edit" | "categories" | "orders" | "payphone" | "bank-accounts" | "coupons" | "users";

export default function AdminTabs({
  products,
  categories,
  adminName,
  canAccessPayphone,
  canManageUsers,
}: AdminTabsProps) {
  const [currentTab, setCurrentTab] = useState<TabValue>("create");
  // Estado compartido de categorías para que se actualice en todos los tabs
  const [sharedCategories, setSharedCategories] = useState<AdminCategory[]>(categories);

  // Callback para actualizar las categorías desde cualquier instancia de AdminProductManager
  const handleCategoriesUpdate = useCallback((updatedCategories: AdminCategory[]) => {
    setSharedCategories(updatedCategories);
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Paper sx={{ bgcolor: "background.paper", overflow: "hidden" }}>
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
          {canAccessPayphone && (
            <Tab label="Configuración de Payphone" value="payphone" />
          )}
          <Tab label="Cuentas Bancarias" value="bank-accounts" />
          <Tab label="Cupones" value="coupons" />
          {canManageUsers && (
            <Tab label="Usuarios" value="users" />
          )}
        </Tabs>
      </Box>

      <Box sx={{ width: "100%", mx: 0, px: 0 }}>
        {currentTab === "create" && (
          <AdminProductManager
            initialProducts={products}
            categories={sharedCategories}
            adminName={adminName}
            initialTab="create"
            onCategoriesUpdate={handleCategoriesUpdate}
          />
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
              categories={sharedCategories}
              adminName={adminName}
              initialTab="edit"
              onCategoriesUpdate={handleCategoriesUpdate}
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
              categories={sharedCategories}
              adminName={adminName}
              initialTab="categories"
              onCategoriesUpdate={handleCategoriesUpdate}
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
            <Link href="/admin/orders" style={{ textDecoration: "none" }}>
              <Button
                variant="contained"
                color="secondary"
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Ver gestión de órdenes
              </Button>
            </Link>
          </Box>
        )}

        {currentTab === "payphone" && (
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Configuración de Payphone
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configura los parámetros de la pasarela de pagos Payphone.
            </Typography>
            <AdminPayphoneSettings />
          </Box>
        )}

        {currentTab === "bank-accounts" && (
          <AdminBankAccountsManager />
        )}

        {currentTab === "coupons" && (
          <AdminCouponsManager />
        )}

        {currentTab === "users" && (
          <AdminUsersManager />
        )}
      </Box>
    </Paper>
  );
}

