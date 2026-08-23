export interface CounterpartyGroup {
    id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Counterparty {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    contactPerson?: string;
    isBuyer: boolean;
    isSeller: boolean;
    priceTypeId?: string | null;
    groupId?: string | null;
    territoryId?: string | null;
    // Expanded fields
    groupName?: string;
    priceTypeName?: string;
    territoryName?: string;
    createdAt?: string;
    updatedAt?: string;
}
