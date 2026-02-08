import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Warehouse = {
    id: string;
    name: string;
};

interface WarehouseState {
    warehouses: Warehouse[];
    addWarehouse: (name: string) => void;
    removeWarehouse: (id: string) => void;
}

export const useWarehouseStore = create<WarehouseState>()(
    persist(
        (set) => ({
            warehouses: [
                { id: "1", name: "Main Warehouse" },
                { id: "2", name: "Kyiv Branch" },
            ],
            addWarehouse: (name) =>
                set((state) => ({
                    warehouses: [
                        ...state.warehouses,
                        { id: Math.random().toString(36).substr(2, 9), name },
                    ],
                })),
            removeWarehouse: (id) =>
                set((state) => ({
                    warehouses: state.warehouses.filter((w) => w.id !== id),
                })),
        }),
        {
            name: "warehouse-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
