import React, { useEffect } from "react";
import AppRouter from "./src/app/AppRouter";
import { initAllTables } from "./src/db/productsDb";
import { useProductsStore } from "./src/store/products.store";

import "./src/i18n";
import { ThemeProvider } from "./src/context/ThemeContext";

import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  const syncProducts = useProductsStore((state) => state.sync);
  const loadProducts = useProductsStore((state) => state.loadProducts);

  useEffect(() => {
    // 1. Initialize Tables
    initAllTables();

    // 2. Load cached data
    loadProducts();

    // 3. Try to sync with server
    syncProducts();
  }, []);

  return (
    <ThemeProvider>
        <SafeAreaProvider>
            <AppRouter />
        </SafeAreaProvider>
    </ThemeProvider>
  );
}
