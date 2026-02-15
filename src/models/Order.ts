export type OrderStatus =
  | "NEW"
  | "ACCEPTED"
  | "COMPLETED";

export type Order = {
  id: string;
  date: string; // ISO Date string
  counterpartyId: string;
  counterpartyName: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  createdAt: number;
  clientId?: string; // Optional if not always present
  clientEmail?: string; // Optional
};
