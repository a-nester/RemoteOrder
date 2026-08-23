import axios from "axios";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/auth.store";
import type { Territory } from "../types/territory";

const BASE_URL = `${API_URL}/territories`;

const getAuthHeader = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const TerritoryService = {
  getAll: async (): Promise<Territory[]> => {
    const response = await axios.get(BASE_URL, { headers: getAuthHeader() });
    return response.data;
  },

  getById: async (id: string): Promise<Territory> => {
    const response = await axios.get(`${BASE_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
  },

  create: async (data: Partial<Territory>): Promise<Territory> => {
    const response = await axios.post(BASE_URL, data, { headers: getAuthHeader() });
    return response.data;
  },

  update: async (id: string, data: Partial<Territory>): Promise<Territory> => {
    const response = await axios.put(`${BASE_URL}/${id}`, data, { headers: getAuthHeader() });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`, { headers: getAuthHeader() });
  },
};
