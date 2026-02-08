export type OrderStatus = "new" | "in_progress" | "done" | "draft";

export interface Order {
  id: string;
  clientEmail: string;
  total: number;
  status: OrderStatus;
  createdAt: number;
  warehouseId?: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Чернетка",
  new: "Нове",
  in_progress: "В роботі",
  done: "Завершено",
};
