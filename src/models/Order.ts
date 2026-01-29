export type OrderStatus =
  | "draft"
  | "pending"
  | "synced"
  | "failed";

export type Order = {
  id: string;              // UUID v4
  clientId: string;
  clientEmail: string;
  createdAt: number;
  status: OrderStatus;
};
