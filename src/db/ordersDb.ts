import * as SQLite from "expo-sqlite";
import { Order } from "../types/order";

const db = SQLite.openDatabaseSync("app.db");

/**
 * CREATE TABLE
 */
export function initOrdersTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY NOT NULL,
      clientEmail TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);
}

/**
 * GET ALL ORDERS
 */
export function getAllOrders(): Order[] {
  return db.getAllSync<Order>(
    "SELECT * FROM orders ORDER BY createdAt DESC"
  );
}

/**
 * GET ORDERS BY CLIENT
 */
export function getOrdersByClient(clientEmail: string): Order[] {
  return db.getAllSync<Order>(
    "SELECT * FROM orders WHERE clientEmail = ? ORDER BY createdAt DESC",
    [clientEmail]
  );
}

/**
 * INSERT ORDER
 */
export function insertOrder(order: Order) {
  db.runSync(
    `INSERT INTO orders (id, clientEmail, total, status, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [
      order.id,
      order.clientEmail,
      order.total,
      order.status,
      order.createdAt,
    ]
  );
}

/**
 * UPDATE STATUS
 */
export function updateOrderStatus(id: string, status: string) {
  db.runSync("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
}
