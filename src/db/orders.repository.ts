import { db } from "./database";
import { Order, OrderStatus } from "../models/Order";

export async function insertOrder(order: Order): Promise<void> {
  await db.runAsync(
    `INSERT INTO orders (id, clientId, clientEmail, status, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [
      order.id,
      order.clientId,
      order.clientEmail,
      order.status,
      order.createdAt,
    ]
  );
}

export async function loadAllOrders(): Promise<Order[]> {
  const result = await db.getAllAsync<Order>(
    `SELECT * FROM orders ORDER BY createdAt DESC`
  );
  return result;
}

export async function loadOrdersByClient(
  clientEmail: string
): Promise<Order[]> {
  const result = await db.getAllAsync<Order>(
    `SELECT * FROM orders WHERE clientEmail = ? ORDER BY createdAt DESC`,
    [clientEmail]
  );
  return result;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  await db.runAsync(
    `UPDATE orders SET status = ? WHERE id = ?`,
    [status, id]
  );
}

