export interface PriceType {
    id: string;
    name: string;
    slug: string;
    currency: string;
    createdAt?: number;
    updatedAt?: number;
    isDeleted?: boolean;
}
