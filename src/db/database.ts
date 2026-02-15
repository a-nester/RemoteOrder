import * as SQLite from "expo-sqlite";
import { initOrdersTable, initOrderItemsTable } from "./ordersDb";
import { initProductsTable } from "./productsDb";
import { initCounterpartiesTable } from "./counterpartiesDb";

export async function initDB() {
  console.log("Initializing Database...");
  const db = SQLite.openDatabaseSync("app.db");
  try {
    console.log("Init Orders Table...");
    initOrdersTable();
    console.log("Init Order Items Table...");
    initOrderItemsTable();
    console.log("Init Products Table...");
    initProductsTable();
    console.log("Init Counterparties Table...");
    initCounterpartiesTable();
    console.log("Database Initialization Complete.");
  } catch (e) {
    console.error("Database Initialization Failed:", e);
  }
}
