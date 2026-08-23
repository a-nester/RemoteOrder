import axios from "axios";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/auth.store";
import type { Role } from "../store/auth.store";

export interface User {
  id: string | number;
  email: string;
  role: Role;
  warehouseId?: string | null;
  visibleWarehouses?: string[];
  visibleTerritories?: string[];
  visiblePriceTypes?: string[];
  counterpartyId?: string | null;
  organizationId?: number | null;
  permissions?: any;
}

const BASE_URL = `${API_URL}/users`;

const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const UsersService = {
  getUsers: async (): Promise<User[]> => {
    const response = await axios.get(BASE_URL, { headers: getAuthHeader() });
    return response.data;
  },

  createUser: async (data: Partial<User> & { password?: string }): Promise<User> => {
    const response = await axios.post(BASE_URL, data, { headers: getAuthHeader() });
    return response.data;
  },

  updateUser: async (id: string | number, data: Partial<User> & { password?: string }): Promise<User> => {
    const response = await axios.put(`${BASE_URL}/${id}`, data, { headers: getAuthHeader() });
    return response.data;
  },

  deleteUser: async (id: string | number): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`, { headers: getAuthHeader() });
  },
};
