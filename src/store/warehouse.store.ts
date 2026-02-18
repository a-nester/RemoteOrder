import { create } from "zustand";
import { WarehousesDb } from "../db/warehousesDb";
import { WarehouseService } from "../services/warehouse.service";
import { Warehouse } from "../types/warehouse";

interface WarehouseState {
    warehouses: Warehouse[];
    loading: boolean;
    loadWarehouses: () => Promise<void>;
    syncWarehouses: () => Promise<void>;
}

export const useWarehouseStore = create<WarehouseState>((set, get) => ({
    warehouses: [],
    loading: false,

    loadWarehouses: async () => {
        set({ loading: true });
        try {
            const data = await WarehousesDb.getAll();
            set({ warehouses: data });
        } catch (error) {
            console.error("Failed to load warehouses", error);
        } finally {
            set({ loading: false });
        }
    },

    syncWarehouses: async () => {
        set({ loading: true });
        try {
            // 1. Fetch from server & Save to DB
            await WarehouseService.sync();
            // 2. Reload from DB
            await get().loadWarehouses();
        } catch (error) {
            console.error("Failed to sync warehouses", error);
        } finally {
            set({ loading: false });
        }
    }
}));
