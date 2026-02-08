import { Order } from "../types/order";

export const mockOrders: Order[] = [
  {
    id: "order-1",
    clientEmail: "client1@test.com", // Belongs to Warehouse 1 (Main)
    total: 1250,
    status: "new",
    createdAt: Date.now() - 1000 * 60 * 60,
    warehouseId: "1",
  },
  {
    id: "order-2",
    clientEmail: "client2@test.com", // Belongs to Warehouse 2 (Kyiv)
    total: 3200,
    status: "in_progress",
    createdAt: Date.now() - 1000 * 60 * 30,
    warehouseId: "2",
  },
  {
    id: "order-3",
    clientEmail: "client1@test.com", // Belongs to Warehouse 1 (Main)
    total: 780,
    status: "done",
    createdAt: Date.now() - 1000 * 60 * 10,
    warehouseId: "1",
  },
];
