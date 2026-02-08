export interface Product {
    id: string;
    name: string;
    prices: Record<string, number>;
    unit: string;
    category: string;
    createdAt: number;
    updatedAt: number;
    photos?: string[];
    localImagePath?: string | null;
    imageLastUpdated?: number | null;
    isDeleted?: boolean; // 0 or 1 in DB, boolean here for convenience? Or keep as number? SQLite has no bool. Let's use number in DB, boolean in interface and convert.
}
