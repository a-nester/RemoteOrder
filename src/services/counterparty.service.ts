import { API_URL, ADMIN_SECRET } from '../constants/api';
import { useAuthStore } from '../store/auth.store';
import { Counterparty, CounterpartyGroup } from '../types/counterparty';
import * as CounterpartiesDb from '../db/counterpartiesDb';

const getHeaders = async () => {
    const token = useAuthStore.getState().token;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-admin-secret': ADMIN_SECRET
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


    // ... (existing code)

    update: async (id: string, data: Partial<Counterparty>): Promise<Counterparty> => {
        try {
            const response = await fetch(`${API_URL}/counterparties/${id}`, {
                method: 'PUT',
                headers: await getHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update counterparty');
            const updated = await response.json();
            CounterpartiesDb.upsertCounterparty(updated);
            return updated;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    syncCounterparties: async () => {
        try {
            console.log("Syncing counterparties...");
            // Use ONLY admin secret to mimic working PriceTypesService
            const response = await fetch(`${API_URL}/counterparties`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': ADMIN_SECRET
                }
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`Counterparty sync failed: ${response.status} ${text}`);
                throw new Error(`Failed to fetch counterparties for sync: ${response.status} ${text}`);
            }

            const data: Counterparty[] = await response.json();

            if (data.length > 0) {
                CounterpartiesDb.bulkUpsertCounterparties(data);
                console.log(`Synced ${data.length} counterparties`);
            }
        } catch (error) {
            console.error("Counterparty sync error details:", error);
        }
    }
};
