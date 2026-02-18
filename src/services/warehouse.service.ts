
import axios from 'axios';
import { API_URL } from '../constants/api';
import { useAuthStore } from '../store/auth.store';
import { WarehousesDb } from '../db/warehousesDb';
import { Warehouse } from '../types/warehouse';

const BASE_URL = `${API_URL}/warehouses`;

export const WarehouseService = {
    sync: async (): Promise<void> => {
        const token = useAuthStore.getState().token;
        if (!token) throw new Error("Not authenticated");

        try {
            const response = await axios.get<Warehouse[]>(BASE_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const warehouses = response.data;
            if (warehouses && warehouses.length > 0) {
                await WarehousesDb.save(warehouses);
            }
        } catch (error) {
            console.error("Failed to sync warehouses", error);
            throw error;
        }
    },

    getAll: async (): Promise<Warehouse[]> => {
        return await WarehousesDb.getAll();
    }
};
