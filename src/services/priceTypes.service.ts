import { PriceType } from "../types/priceType";
import { bulkUpsertPriceTypes, getAllPriceTypes, deletePriceType as deleteLocalPriceType } from "../db/productsDb";

// Re-using ADMIN_API_URL base, but strictly speaking we need to append endpoints
const ADMIN_API_URL = "https://remoteorder-server.onrender.com/api/admin";
const ADMIN_SECRET = "secure-admin-key-123";

export const PriceTypesService = {
    /**
     * FETCH ALL
     */
    async fetchPriceTypes(): Promise<PriceType[]> {
        try {
            const url = `${ADMIN_API_URL}/price-types`;
            console.log(`Fetching price types from: ${url}`);
            const response = await fetch(url, {
                headers: {
                    "x-admin-secret": ADMIN_SECRET
                }
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`Failed to fetch price types: ${response.status} ${text}`);
                throw new Error(`Failed to fetch price types: ${response.status} ${text}`);
            }

            const data = await response.json();
            // Assuming data is array of PriceType
            const items = Array.isArray(data) ? data : [];
            return items.map((item: any) => ({
                ...item,
                prices: item.prices ? JSON.parse(item.prices) : undefined, // parsing prices if needed, though they are on products not types usually.
                // API returns 'deleted', local uses 'isDeleted'
                isDeleted: item.deleted !== undefined ? item.deleted : (!!item.isDeleted)
            }));
        } catch (error) {
            console.error("Error fetching price types:", error);
            throw error;
        }
    },

    /**
     * SYNC
     * Simple strategy: fetch all replace (upsert) all.
     */
    async syncPriceTypes() {
        try {
            console.log("Syncing price types...");
            const remoteTypes = await this.fetchPriceTypes();
            if (remoteTypes.length > 0) {
                bulkUpsertPriceTypes(remoteTypes.map(pt => ({
                    ...pt,
                    createdAt: new Date(pt.createdAt || Date.now()).getTime(),
                    updatedAt: new Date(pt.updatedAt || Date.now()).getTime(),
                })));
                console.log(`Synced ${remoteTypes.length} price types.`);
            }
        } catch (error) {
            console.error("Sync price types failed:", error);
        }
    },

    /**
     * CREATE
     */
    async createPriceType(name: string, slug: string): Promise<void> {
        const response = await fetch(`${ADMIN_API_URL}/price-types`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-admin-secret": ADMIN_SECRET
            },
            body: JSON.stringify({ name, slug })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to create price type: ${text}`);
        }
    },

    /**
     * UPDATE
     */
    async updatePriceType(id: string, name: string, slug: string): Promise<void> {
        const response = await fetch(`${ADMIN_API_URL}/price-types/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-admin-secret": ADMIN_SECRET
            },
            body: JSON.stringify({ name, slug })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to update price type: ${text}`);
        }
    },

    /**
     * DELETE
     */
    async deletePriceType(id: string): Promise<void> {
        const response = await fetch(`${ADMIN_API_URL}/price-types/${id}`, {
            method: "DELETE",
            headers: {
                "x-admin-secret": ADMIN_SECRET
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to delete price type`);
        }

        // Soft delete locally
        deleteLocalPriceType(id);
    }
};
