import axios from 'axios';
import { API_URL } from '../constants/api';
import { useAuthStore } from '../store/auth.store';
import { Organization } from '../types/organization';
import { Warehouse } from '../types/warehouse';

const BASE_URL = `${API_URL}/organization`;

const getAuthHeader = () => {
    const token = useAuthStore.getState().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const OrganizationService = {
    getOrganization: async (): Promise<Organization> => {
        const response = await axios.get(BASE_URL, { headers: getAuthHeader() });
        return response.data;
    },

    updateOrganization: async (data: Partial<Organization>): Promise<Organization> => {
        const response = await axios.put(BASE_URL, data, { headers: getAuthHeader() });
        return response.data;
    },

    // Warehouses (reusing existing API endpoints for admin management)
    getWarehouses: async (): Promise<Warehouse[]> => {
        const response = await axios.get(`${BASE_URL}/warehouses`, { headers: getAuthHeader() });
        return response.data;
    },

    createWarehouse: async (data: Partial<Warehouse>): Promise<Warehouse> => {
        const response = await axios.post(`${BASE_URL}/warehouses`, data, { headers: getAuthHeader() });
        return response.data;
    },

    updateWarehouse: async (id: string, data: Partial<Warehouse>): Promise<Warehouse> => {
        const response = await axios.put(`${BASE_URL}/warehouses/${id}`, data, { headers: getAuthHeader() });
        return response.data;
    },
};
