import * as SQLite from "expo-sqlite";
import { Product } from "../types/product";
import { PriceType } from "../types/priceType";
import { CREATE_PRODUCTS_TABLE, CREATE_METADATA_TABLE, CREATE_PRICE_TYPES_TABLE } from "./schema";

const db = SQLite.openDatabaseSync("app.db");

/**
 * CREATE TABLE
 */
/**
 * CREATE TABLE
 */
export function initProductsTable() {
    try {
        // Force update: Check for old 'price' column
        const checkOldSchema = db.getAllSync(`PRAGMA table_info(products)`);
        const hasPriceColumn = (checkOldSchema as any[])?.some(col => col.name === 'price');

        if (hasPriceColumn) {
            console.log("Migrating products table: Dropping old table to add 'prices' column");
            db.execSync(`DROP TABLE IF EXISTS products`);
            // Re-create table immediately
            db.execSync(CREATE_PRODUCTS_TABLE);
        } else {
            // If no old column, ensure table exists (first run)
            db.execSync(CREATE_PRODUCTS_TABLE);
        }

        // Check for new columns in case table existed but was missing them (partial migration)
        const columns = db.getAllSync("PRAGMA table_info(products)") as any[];
        const hasLocalImagePath = columns.some((c) => c.name === "localImagePath");
        const hasImageLastUpdated = columns.some((c) => c.name === "imageLastUpdated");
        const hasPrices = columns.some(c => c.name === 'prices');
        const hasIsDeleted = columns.some(c => c.name === 'isDeleted');

        if (!hasLocalImagePath) {
            db.execSync("ALTER TABLE products ADD COLUMN localImagePath TEXT");
        }
        if (!hasImageLastUpdated) {
            db.execSync("ALTER TABLE products ADD COLUMN imageLastUpdated INTEGER");
        }
        if (!hasPrices) {
            db.execSync("ALTER TABLE products ADD COLUMN prices TEXT");
        }
        if (!hasIsDeleted) {
            db.execSync("ALTER TABLE products ADD COLUMN isDeleted INTEGER DEFAULT 0");
        }

    } catch (e) {
        console.error("Migration failed:", e);
    }
    initMetadataTable();
}

/**
 * GET ALL PRODUCTS
 */
export function getAllProducts(includeDeleted = false): Product[] {
    const query = includeDeleted
        ? "SELECT * FROM products ORDER BY name ASC"
        : "SELECT * FROM products WHERE isDeleted = 0 ORDER BY name ASC";

    const rows = db.getAllSync<any>(query);
    return rows.map(row => ({
        ...row,
        prices: row.prices ? JSON.parse(row.prices) : { standard: row.price || 0 }, // Fallback to old price if new column empty
        isDeleted: !!row.isDeleted
    }));
}

/**
 * UPSERT SINGLE PRODUCT
 */
export function upsertProduct(product: Product) {
    db.runSync(
        `INSERT OR REPLACE INTO products (id, name, prices, unit, category, createdAt, updatedAt, localImagePath, imageLastUpdated, isDeleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            product.id,
            product.name,
            JSON.stringify(product.prices),
            product.unit,
            product.category,
            product.createdAt,
            product.updatedAt,
            product.localImagePath || null,
            product.imageLastUpdated || null,
            product.isDeleted ? 1 : 0
        ]
    );
}

/**
 * SOFT DELETE PRODUCT
 */
export function deleteProduct(id: string) {
    db.runSync("UPDATE products SET isDeleted = 1 WHERE id = ?", [id]);
}

/**
 * UPDATE PRODUCT IMAGE
 */
export function updateProductImage(
    id: string,
    localImagePath: string,
    imageLastUpdated: number
) {
    db.runSync(
        "UPDATE products SET localImagePath = ?, imageLastUpdated = ? WHERE id = ?",
        [localImagePath, imageLastUpdated, id]
    );
}

/**
 * BULK UPSERT PRODUCTS
 */
export function bulkUpsertProducts(products: Product[]) {
    // Use a transaction for better performance on bulk inserts
    db.withTransactionSync(() => {
        for (const product of products) {
            upsertProduct(product);
        }
    });
}

/**
 * METADATA
 */
export function initMetadataTable() {
    db.execSync(CREATE_METADATA_TABLE);
}

export function getLastSyncTime(): number {
    const result = db.getFirstSync<{ value: string }>(
        "SELECT value FROM metadata WHERE key = ?",
        ["last_product_sync_time"]
    );
    return result ? parseInt(result.value, 10) : 0;
}

export function setLastSyncTime(timestamp: number) {
    db.runSync(
        "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
        ["last_product_sync_time", timestamp.toString()]
    );
}

/**
 * PRICE TYPES
 */
// Imports are at the top

export function initPriceTypesTable() {
    db.execSync(CREATE_PRICE_TYPES_TABLE);

    // Check for isDeleted column
    const columns = db.getAllSync("PRAGMA table_info(price_types)") as any[];
    const hasIsDeleted = columns.some(c => c.name === 'isDeleted');

    if (!hasIsDeleted) {
        db.execSync("ALTER TABLE price_types ADD COLUMN isDeleted INTEGER DEFAULT 0");
    }
}

export function getAllPriceTypes(includeDeleted = false): PriceType[] {
    const query = includeDeleted
        ? "SELECT * FROM price_types ORDER BY name ASC"
        : "SELECT * FROM price_types WHERE isDeleted = 0 ORDER BY name ASC";

    const rows = db.getAllSync<any>(query);
    return rows.map(row => ({
        ...row,
        isDeleted: !!row.isDeleted
    }));
}

export function upsertPriceType(priceType: PriceType) {
    db.runSync(
        `INSERT OR REPLACE INTO price_types (id, name, slug, createdAt, updatedAt, isDeleted)
     VALUES (?, ?, ?, ?, ?, ?)`,
        [
            priceType.id,
            priceType.name,
            priceType.slug,
            priceType.createdAt || Date.now(),
            priceType.updatedAt || Date.now(),
            priceType.isDeleted ? 1 : 0
        ]
    );
}

export function deletePriceType(id: string) {
    // Soft delete
    db.runSync("UPDATE price_types SET isDeleted = 1 WHERE id = ?", [id]);
}

export function bulkUpsertPriceTypes(priceTypes: PriceType[]) {
    db.withTransactionSync(() => {
        for (const pt of priceTypes) {
            upsertPriceType(pt);
        }
    });
}

/**
 * INITIALIZE ALL TABLES
 */
export function initAllTables() {
    initProductsTable();
    initMetadataTable();
    initPriceTypesTable();
}
