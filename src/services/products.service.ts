import { Product } from "../types/product";
import { bulkUpsertProducts, getAllProducts, updateProductImage, getLastSyncTime, setLastSyncTime, deleteProduct as deleteLocalProduct } from "../db/productsDb";
import { ImageService } from "./image.service";

import { API_URL, ADMIN_SECRET } from "../constants/api";

// Remove local redeclarations if they match the imported names, or mapping them
// The existing code uses API_URL for products endpoint specifically?
// Original: const API_URL = "https.../api/products";
// We should change it to use the base API_URL from constants.

const PRODUCTS_API_URL = `${API_URL}/products`;
const ADMIN_BASE_URL = `${API_URL}/admin`;
const ADMIN_PRODUCTS_URL = `${API_URL}/admin/products`;

export const ProductsService = {
    /**
     * FETCH FROM API
     */
    async fetchProducts(since?: number): Promise<{ products: Product[], timestamp: number }> {
        try {
            const url = since ? `${PRODUCTS_API_URL}?since=${since}` : PRODUCTS_API_URL;
            console.log(`Fetching products from: ${url}`);

            const response = await fetch(url);
            if (!response.ok) {
                const text = await response.text();
                // ...
            }
            // ... (rest of fetchProducts logic)
            const rawData = await response.json();

            // Check for { items: [], timestamp: number } format
            const items = Array.isArray(rawData) ? rawData : (rawData.items || []);
            const timestamp = typeof rawData === 'object' && rawData.timestamp ? rawData.timestamp : Date.now();

            if (!Array.isArray(items)) {
                console.warn("Unexpected API response format:", rawData);
                return { products: [], timestamp: Date.now() };
            }

            const products = items.map((item: any) => ({
                id: item.id,
                name: item.name,
                prices: item.prices || { standard: parseFloat(item.price) || 0 },
                unit: item.unit,
                category: item.category,
                photos: item.photos || [],
                createdAt: new Date(item.createdAt).getTime(),
                updatedAt: new Date(item.updatedAt).getTime(),
                isDeleted: !!item.isDeleted,
            }));

            return { products, timestamp };
        } catch (error) {
            console.error("Error fetching products:", error);
            throw error;
        }
    },


    /**
     * CREATE PRODUCT
     */
    async createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">, imageUri?: string): Promise<void> {
        try {
            const formData = new FormData();
            // ... (formData appending)
            formData.append("name", product.name);
            formData.append("prices", JSON.stringify(product.prices));
            formData.append("unit", product.unit);
            formData.append("category", product.category);

            if (imageUri) {
                formData.append("photos", {
                    uri: imageUri,
                    name: "photo.jpg",
                    type: "image/jpeg",
                } as any);
            }

            const response = await fetch(ADMIN_PRODUCTS_URL, {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                    "x-admin-secret": ADMIN_SECRET,
                },
            });
            // ...
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to create product: ${response.statusText} ${text}`);
            }
        } catch (error) {
            console.error("Error creating product:", error);
            throw error;
        }
    },

    /**
     * UPDATE PRODUCT
     */
    async updateProduct(product: Product, imageUri?: string): Promise<void> {
        try {
            const formData = new FormData();
            // ... (formData appending)
            formData.append("name", product.name);
            formData.append("prices", JSON.stringify(product.prices));
            formData.append("unit", product.unit);
            formData.append("category", product.category);

            if (imageUri) {
                formData.append("photos", {
                    uri: imageUri,
                    name: "photo.jpg",
                    type: "image/jpeg",
                } as any);
            }

            const response = await fetch(`${ADMIN_PRODUCTS_URL}/${product.id}`, {
                method: "PUT",
                body: formData,
                headers: {
                    "x-admin-secret": ADMIN_SECRET,
                },
            });
            // ...
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to update product: ${response.statusText} ${text}`);
            }
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    },

    // ... (uploadProductImage ignored as deprecated)
    async uploadProductImage(id: string, fileUri: string): Promise<void> {
        console.warn("uploadProductImage is deprecated. Images are now uploaded via createProduct/updateProduct.");
    },

    /**
     * DELETE PRODUCT
     */
    async deleteProduct(id: string): Promise<void> {
        try {
            const response = await fetch(`${ADMIN_PRODUCTS_URL}/${id}`, {
                method: "DELETE",
                headers: {
                    "x-admin-secret": ADMIN_SECRET,
                },
            });
            // ...
            if (!response.ok) {
                throw new Error(`Failed to delete product: ${response.statusText}`);
            }
            deleteLocalProduct(id);
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    },

    async deleteProductImage(id: string): Promise<void> {
        // ... (keep as is or update if needed, but likely unused)
        try {
            const response = await fetch(`${PRODUCTS_API_URL}/${id}/image`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(`Failed to delete image: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            throw error;
        }
    },


    /**
     * SYNC
     */
    async syncProducts() {
        // ... (sync logic uses fetchProducts and is fine)
        // copy existing syncProducts logic
        try {
            const lastSyncTime = getLastSyncTime();
            console.log(`Syncing products since: ${lastSyncTime} (${new Date(lastSyncTime).toISOString()})`);

            const { products: remoteProducts, timestamp } = await this.fetchProducts(lastSyncTime);

            if (remoteProducts.length === 0) {
                console.log("No new products to sync.");
                if (timestamp > lastSyncTime) {
                    setLastSyncTime(timestamp);
                }
                return;
            }

            const localProducts = getAllProducts(true);
            const localMap = new Map(localProducts.map(p => [p.id, p]));

            const productsToUpsert = remoteProducts.map(remote => {
                const local = localMap.get(remote.id);
                return {
                    ...remote,
                    localImagePath: local?.localImagePath,
                    imageLastUpdated: local?.imageLastUpdated
                };
            });

            bulkUpsertProducts(productsToUpsert);
            console.log(`Synced ${productsToUpsert.length} products to local DB`);

            for (const remote of remoteProducts) {
                const local = localMap.get(remote.id);
                const needsUpdate =
                    !local?.localImagePath ||
                    (local.imageLastUpdated || 0) < remote.updatedAt;

                if (needsUpdate) {
                    const photoPath = (remote.photos && remote.photos.length > 0) ? remote.photos[0] : null;

                    if (photoPath) {
                        console.log(`Downloading image for product: ${remote.name} from ${photoPath}`);
                        const localUri = await ImageService.downloadImage(remote.id, photoPath);

                        if (localUri) {
                            updateProductImage(remote.id, localUri, remote.updatedAt);
                        }
                    }
                }
            }
            setLastSyncTime(timestamp);

        } catch (error) {
            console.error("Sync failed:", error);
        }
    },

    /**
     * SET PRICE (Journal)
     */
    async setProductPrice(
        productId: string,
        price: number,
        priceTypeId?: string,
        reason?: string,
        effectiveDate?: Date
    ): Promise<void> {
        try {
            // UPDATED: Use ADMIN_BASE_URL (api/admin) + /prices/set
            const response = await fetch(`${ADMIN_BASE_URL}/prices/set`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-secret": ADMIN_SECRET,
                },
                body: JSON.stringify({
                    productId,
                    price,
                    priceTypeId,
                    reason,
                    effectiveDate: effectiveDate?.toISOString()
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to set price: ${response.statusText} ${text}`);
            }
        } catch (error) {
            console.error("Error setting price:", error);
            throw error;
        }
    },

    /**
     * GET PRICE HISTORY
     */
    async getProductPriceHistory(productId: string): Promise<any[]> {
        try {
            // UPDATED: Use ADMIN_BASE_URL (api/admin) + /prices/history
            const response = await fetch(`${ADMIN_BASE_URL}/prices/history/${productId}`, {
                method: "GET",
                headers: {
                    "x-admin-secret": ADMIN_SECRET,
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch price history: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error getting price history:", error);
            throw error;
        }
    }
};
