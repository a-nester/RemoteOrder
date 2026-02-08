import { create } from "zustand";
import { Product } from "../types/product";
import { getAllProducts } from "../db/productsDb";
import { ProductsService } from "../services/products.service";
import { PriceTypesService } from "../services/priceTypes.service";

interface ProductsState {
    products: Product[];
    loading: boolean;
    refreshing: boolean;
    loadProducts: () => void;
    sync: () => Promise<void>;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
    products: [],
    loading: false,
    refreshing: false,

    loadProducts: () => {
        const products = getAllProducts();
        set({ products });
    },

    sync: async () => {
        try {
            set({ refreshing: true });

            // 1. Fetch from API and update local DB (both products and price types)
            await Promise.all([
                ProductsService.syncProducts(),
                PriceTypesService.syncPriceTypes()
            ]);

            // 2. Reload from local DB to update UI
            get().loadProducts();

            set({ refreshing: false });
        } catch (error: any) {
            console.error("Sync error:", error);
            set({ refreshing: false });
        }
    },
}));
