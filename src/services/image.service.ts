import * as FileSystem from "expo-file-system/legacy";

const IMAGE_DIR = (FileSystem.documentDirectory || "") + "product_images/";
const BASE_URL = "https://remoteorder-server.onrender.com/images/";

/**
 * Ensure the image directory exists
 */
async function ensureDirExists() {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    }
}

export const ImageService = {
    /**
     * DOWNLOAD IMAGE
     * Returns local URI if successful, or null if failed/404
     */
    async downloadImage(productId: string, remotePath: string): Promise<string | null> {
        try {
            await ensureDirExists();

            // remotePath is like "/uploads/..."
            const baseUrl = "https://remoteorder-server.onrender.com";
            const remoteUri = `${baseUrl}${remotePath}`;
            const localUri = `${IMAGE_DIR}${productId}.jpg`;

            const downloadRes = await FileSystem.downloadAsync(remoteUri, localUri);

            if (downloadRes.status !== 200) {
                // If not found or error, delete the partial file if it exists
                await FileSystem.deleteAsync(localUri, { idempotent: true });
                return null;
            }

            return localUri;
        } catch (error) {
            console.error("Image download error:", error);
            return null;
        }
    },

    /**
     * DELETE IMAGE
     */
    async deleteImage(productId: string) {
        const localUri = `${IMAGE_DIR}${productId}.jpg`;
        await FileSystem.deleteAsync(localUri, { idempotent: true });
    },
};
