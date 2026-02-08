export interface PriceHistoryEntry {
    id: string;
    productId: string;
    priceTypeId?: string | null;
    oldPrice: number;
    newPrice: number;
    effectiveDate: string; // ISO date string
    createdBy?: string | null;
    reason?: string | null;
    createdAt: string;
}
