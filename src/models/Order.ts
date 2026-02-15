export type OrderStatus =
  | "NEW"
  | "ACCEPTED"
  | "COMPLETED";

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
  total: number;
};

export type Order = {
  id: string;
  date: string; // ISO Date string
  counterpartyId: string;
  counterpartyName: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt?: number;
  clientId?: string;
  clientEmail?: string;
  comment?: string;
  isDraft: number; // 0 or 1 for SQLite boolean
  items: OrderItem[];
};
