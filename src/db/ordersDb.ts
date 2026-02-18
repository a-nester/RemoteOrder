import * as SQLite from "expo-sqlite";
import { Order, OrderItem } from "../models/Order";
import { CREATE_ORDERS_TABLE, CREATE_ORDER_ITEMS_TABLE } from "./schema";

const db = SQLite.openDatabaseSync("app.db");

/**
 * CREATE TABLE
 */
export function initOrdersTable() {
  try {
    // Check for new schema columns by checking if 'date' column exists
    // If not, we might need migration or re-create.
    // For development simplicity, if schema mismatch, we can recreate or alter.
    // Let's check for 'date' column.
    const columns = db.getAllSync("PRAGMA table_info(orders)") as any[];
    const hasDate = columns.some(c => c.name === 'date');
    const hasCounterpartyId = columns.some(c => c.name === 'counterpartyId');
    const hasIsDeleted = columns.some(c => c.name === 'isDeleted');

    if ((!hasDate || !hasCounterpartyId || !hasIsDeleted) && columns.length > 0) {
      console.log("Migrating orders table: Dropping old table");
      db.execSync(`DROP TABLE IF EXISTS orders`);
    }

    db.execSync(CREATE_ORDERS_TABLE);
  } catch (e) {
    console.error("Failed to init orders table", e);
  }
}

export function initOrderItemsTable() {
  db.execSync(CREATE_ORDER_ITEMS_TABLE);
}


/**
 * GET ALL ORDERS (Non-Drafts, Non-Deleted)
 */
export function getAllOrders(): Order[] {
  const orders = db.getAllSync<any>(
    "SELECT * FROM orders WHERE isDraft = 0 AND isDeleted = 0 ORDER BY createdAt DESC"
  );
  return orders.map(mapOrderFromDb);
}

/**
 * GET ARCHIVED ORDERS (Deleted)
 */
export function getArchivedOrders(): Order[] {
  const orders = db.getAllSync<any>(
    "SELECT * FROM orders WHERE isDeleted = 1 ORDER BY updatedAt DESC"
  );
  return orders.map(mapOrderFromDb);
}

/**
 * GET DRAFTS
 */
export function getDraftOrders(): Order[] {
  const orders = db.getAllSync<any>(
    "SELECT * FROM orders WHERE isDraft = 1 ORDER BY updatedAt DESC"
  );
  return orders.map(mapOrderFromDb);
}

/**
 * GET ORDER ITEMS
 */
export function getOrderItems(orderId: string): OrderItem[] {
  return db.getAllSync<OrderItem>(
    "SELECT * FROM order_items WHERE orderId = ?",
    [orderId]
  );
}

/**
 * SAVE OR UPDATE ORDER (Draft or Final)
 */
export function saveOrder(order: Order) {
  db.withTransactionSync(() => {
    // 1. Upsert Order
    db.runSync(
      `INSERT OR REPLACE INTO orders (id, date, counterpartyId, counterpartyName, amount, currency, status, createdAt, updatedAt, clientId, clientEmail, comment, isDraft, isDeleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.date,
        order.counterpartyId,
        order.counterpartyName,
        order.amount,
        order.currency,
        order.status,
        order.createdAt,
        Date.now(), // Always update updatedAt
        order.clientId || null,
        order.clientEmail || null,
        order.comment || null,
        order.isDraft,
        order.isDeleted || 0
      ]
    );

    // 2. Replace Items (Delete all and insert new)
    db.runSync("DELETE FROM order_items WHERE orderId = ?", [order.id]);

    for (const item of order.items) {
      db.runSync(
        `INSERT OR REPLACE INTO order_items (id, orderId, productId, productName, quantity, price, unit, total)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.orderId,
          item.productId,
          item.productName,
          item.quantity,
          item.price,
          item.unit,
          item.total
        ]
      );
    }
  });
}

/**
 * DELETE ORDER (Soft Delete)
 */
export function deleteOrder(id: string) {
  db.runSync("UPDATE orders SET isDeleted = 1, updatedAt = ? WHERE id = ?", [Date.now(), id]);
}

/**
 * HARD DELETE ORDER (Admin Only)
 */
export function hardDeleteOrder(id: string) {
  db.runSync("DELETE FROM orders WHERE id = ?", [id]);
  db.runSync("DELETE FROM order_items WHERE orderId = ?", [id]);
}

// Helper to map DB row to Order object
function mapOrderFromDb(row: any): Order {
  const items = getOrderItems(row.id);
  return {
    ...row,
    items: items || []
  };
}
