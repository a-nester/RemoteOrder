import { API_URL, ADMIN_SECRET } from "../constants/api";

export interface PriceDocumentItem {
    id?: string;
    documentId: string;
    productId: string;
    price: number;
    productName?: string;
    unit?: string;
}

export interface PriceDocument {
    id: string;
    date: string;
    status: 'DRAFT' | 'APPLIED';
    targetPriceTypeId: string;
    targetPriceTypeName?: string;
    inputMethod: 'MANUAL' | 'FORMULA';
    sourcePriceTypeId?: string;
    sourcePriceTypeName?: string;
    markupPercentage?: number;
    roundingMethod?: string;
    comment?: string;
    items?: PriceDocumentItem[];
    createdAt: string;
}

export class PriceDocumentsService {
    static async getDocuments(): Promise<PriceDocument[]> {
        const response = await fetch(`${API_URL}/price-documents`, {
            headers: { "x-admin-secret": ADMIN_SECRET }
        });
        if (!response.ok) throw new Error("Failed to fetch documents");
        return response.json();
    }

    static async getDocument(id: string): Promise<PriceDocument> {
        const response = await fetch(`${API_URL}/price-documents/${id}`, {
            headers: { "x-admin-secret": ADMIN_SECRET }
        });
        if (!response.ok) throw new Error("Failed to fetch document");
        return response.json();
    }

    static async createDocument(data: Partial<PriceDocument>): Promise<PriceDocument> {
        const response = await fetch(`${API_URL}/price-documents`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-admin-secret": ADMIN_SECRET
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to create document");
        return response.json();
    }

    static async updateDocument(id: string, data: Partial<PriceDocument>): Promise<PriceDocument> {
        const response = await fetch(`${API_URL}/price-documents/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-admin-secret": ADMIN_SECRET
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update document");
        return response.json();
    }

    static async updateDocumentItems(id: string, items: { productId: string; price: number }[]): Promise<void> {
        const response = await fetch(`${API_URL}/price-documents/${id}/items`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-admin-secret": ADMIN_SECRET
            },
            body: JSON.stringify({ items }),
        });
        if (!response.ok) throw new Error("Failed to update items");
    }

    static async applyDocument(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/price-documents/${id}/apply`, {
            method: "POST",
            headers: { "x-admin-secret": ADMIN_SECRET }
        });
        if (!response.ok) throw new Error("Failed to apply document");
    }
}
