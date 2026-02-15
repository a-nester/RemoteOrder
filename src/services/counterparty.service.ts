
import { API_URL } from '../constants/api';
import { useAuthStore } from '../store/auth.store';
import { Counterparty, CounterpartyGroup } from '../types/counterparty';

const getHeaders = async () => {
    const token = useAuthStore.getState().token;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const CounterpartyService = {
    // Groups
    getGroups: async (): Promise<CounterpartyGroup[]> => {
        try {
            const response = await fetch(`${API_URL}/counterparty-groups`, {
                headers: await getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch groups');
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    createGroup: async (name: string): Promise<CounterpartyGroup> => {
        try {
            const response = await fetch(`${API_URL}/counterparty-groups`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error('Failed to create group');
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Counterparties
    getAll: async (): Promise<Counterparty[]> => {
        try {
            const response = await fetch(`${API_URL}/counterparties`, {
                headers: await getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch counterparties');
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    create: async (data: Partial<Counterparty>): Promise<Counterparty> => {
        try {
            const response = await fetch(`${API_URL}/counterparties`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create counterparty');
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    update: async (id: string, data: Partial<Counterparty>): Promise<Counterparty> => {
        try {
            const response = await fetch(`${API_URL}/counterparties/${id}`, {
                method: 'PUT',
                headers: await getHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update counterparty');
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
};
