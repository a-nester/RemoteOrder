import { Product } from "../types/product";
import { bulkUpsertProducts, getAllProducts, updateProductImage, getLastSyncTime, setLastSyncTime, deleteProduct as deleteLocalProduct } from "../db/productsDb";
import { ImageService } from "./image.service";

const API_URL = "https://remoteorder-server.onrender.com/api/products";
const ADMIN_API_URL = "https://remoteorder-server.onrender.com/api/admin/products";

const ADMIN_SECRET = "secure-admin-key-123";

export const ProductsService = {
    /**
     * FETCH FROM API
     */
    async fetchProducts(since?: number): Promise<{ products: Product[], timestamp: number }> {
        try {
            const url = since ? `${API_URL}?since=${since}` : API_URL;
            console.log(`Fetching products from: ${url}`);

            const response = await fetch(url);
            if (!response.ok) {
                const text = await response.text();
                console.error("Fetch failed:", response.status, text);
                throw new Error(`Failed to fetch products: ${response.status} ${text}`);
            }

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
                isDeleted: !!item.isDeleted, // Map from server if exists
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

            const response = await fetch(ADMIN_API_URL, {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                    "x-admin-secret": ADMIN_SECRET,
                },
            });

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

            const response = await fetch(`${ADMIN_API_URL}/${product.id}`, {
                method: "PUT",
                body: formData,
                headers: {
                    // Content-Type set automatically for FormData
                    "x-admin-secret": ADMIN_SECRET,
                },
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to update product: ${response.statusText} ${text}`);
            }
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    },

    /**
     * UPLOAD IMAGE (Standalone - kept if needed for updates, but CREATE uses multipart)
     * Note: If PUT supports multipart, we could merge this. 
     * For now assuming existing flow for updates still uses this or checks API.
     * User didn't specify IMAGE update endpoint, but implied /api/admin/products/:id updates product.
     * We'll keep this separate for now as it's safe, but update path to admin if needed?
     * User said: "PUT /api/admin/products/:id: Update an existing product."
     * User didn't mention separate image upload for admin.
     * However, the previous plan used separate. 
     * Let's assume standard REST: PUT updates resource.
     * But handling file upload via PUT JSON is impossible. 
     * If user didn't specify, maybe the POST /api/admin/products is for create WITH photo.
     * I will keep uploadProductImage but point it to the likely endpoint or keep as is if it was working?
     * Actually, let's assume I should use the specific image endpoint I essentially invented or was implied before, 
     * OR better: creating a new function `updateProductWithImage` that uses multipart PUT if supported?
     * 
     * Let's stick to the previous `uploadProductImage` but maybe prefix with admin if consistent?
     * The user ONLY gave:
     * POST /api/admin/products
     * PUT /api/admin/products/:id
     * DELETE /api/admin/products/:id
     * 
     * If I want to change photo, maybe I send multipart to PUT?
     * Let's try to keep `uploadProductImage` but creating a new path?
     * Or maybe `POST /api/admin/products` is ONLY for create.
     * 
     * I will leave `uploadProductImage` targeting `/api/products/${id}/image` for now as I don't have a clear new endpoint for it,
     * UNLESS `PUT /api/admin/products/:id` supports multipart. 
     * I'll assume `PUT` is JSON for now given the user description "Update an existing product" without "multipart".
     * 
     * Wait, `DELETE /api/admin/products/:id` is for DELETE PRODUCT.
     * My `deleteProductImage` was for deleting IMAGE.
     * 
     * I will Add `deleteProduct` function.
     */

    // Keeping this for image-only updates if the backend supports it, otherwise might need refactor.
    // I'll stick to the previous URL for image upload since user didn't override it explicitly for "Image Upload" only "Create Product".
    async uploadProductImage(id: string, fileUri: string): Promise<void> {
        console.warn("uploadProductImage is deprecated. Images are now uploaded via createProduct/updateProduct.");
    },

    /**
     * DELETE PRODUCT
     */
    /**
     * DELETE PRODUCT
     */
    async deleteProduct(id: string): Promise<void> {
        try {
            // User specified: DELETE /api/admin/products/:id
            const response = await fetch(`${ADMIN_API_URL}/${id}`, {
                method: "DELETE",
                headers: {
                    "x-admin-secret": ADMIN_SECRET,
                },
            });

            if (!response.ok) {
                // If soft delete on server fails, unlikely we should proceed, but for offline-first, maybe?
                // For now, strict.
                throw new Error(`Failed to delete product: ${response.statusText}`);
            }

            // Soft delete locally
            deleteLocalProduct(id);
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    },

    /**
     * DELETE IMAGE (Keep original or remove if not needed)
     */
    async deleteProductImage(id: string): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/${id}/image`, {
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
     * Fetch from API and update local DB
     */
    async syncProducts() {
        try {
            // Retrieve lastSyncTime from metadata
            const lastSyncTime = getLastSyncTime();
            console.log(`Syncing products since: ${lastSyncTime} (${new Date(lastSyncTime).toISOString()})`);

            const { products: remoteProducts, timestamp } = await this.fetchProducts(lastSyncTime);

            if (remoteProducts.length === 0) {
                console.log("No new products to sync.");
                // Even if no products, update timestamp to server time if provided to avoid re-checking old window
                if (timestamp > lastSyncTime) {
                    setLastSyncTime(timestamp);
                }
                return;
            }

            // 1. Get local products (Include deleted to ensure we map images correctly)
            const localProducts = getAllProducts(true);
            const localMap = new Map(localProducts.map(p => [p.id, p]));

            // 2. Prepare products for bulk upsert
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

            // 3. Sync Images
            for (const remote of remoteProducts) {
                const local = localMap.get(remote.id);
                // Check if image update needed...
                const needsUpdate =
                    !local?.localImagePath ||
                    (local.imageLastUpdated || 0) < remote.updatedAt;

                if (needsUpdate) {
                    // Use first photo if available, otherwise fallback (though fallback likely fails with new logic)
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

            // 4. Update lastSyncTime
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
            const response = await fetch(`https://remoteorder-server.onrender.com/api/admin/prices/set`, {
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
            const response = await fetch(`https://remoteorder-server.onrender.com/api/admin/prices/history/${productId}`, {
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
