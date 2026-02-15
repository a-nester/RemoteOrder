import * as SQLite from "expo-sqlite";
import { initOrdersTable, initOrderItemsTable } from "./ordersDb";
import { initProductsTable } from "./productsDb";

export async function initDB() {
  const db = SQLite.openDatabaseSync("app.db");
  initOrdersTable();
  initOrderItemsTable();
  initProductsTable();
}
