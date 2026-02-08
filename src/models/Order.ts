export type OrderStatus =
  | "draft"
  | "pending"
  | "synced"
  | "failed";

export type Order = {
  id: string;
  clientId: string;
  clientEmail: string;
  status: OrderStatus;
  createdAt: number;
};
