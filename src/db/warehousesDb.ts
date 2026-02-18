import * as SQLite from "expo-sqlite";
import { Warehouse } from "../types/warehouse";
import { CREATE_WAREHOUSES_TABLE } from "./schema";

const db = SQLite.openDatabaseSync("app.db");

export function initWarehousesTable() {
    try {
        db.execSync(CREATE_WAREHOUSES_TABLE);
    } catch (e) {
        console.error("Failed to init warehouses table", e);
    }
}

export const WarehousesDb = {
    getAll: async (): Promise<Warehouse[]> => {
        return await db.getAllAsync<Warehouse>(
            `SELECT * FROM warehouses WHERE isDeleted = 0 ORDER BY name ASC`
        );
    },

    save: async (warehouses: Warehouse[]): Promise<void> => {
        await db.withTransactionAsync(async () => {
            for (const warehouse of warehouses) {
                await db.runAsync(
                    `INSERT OR REPLACE INTO warehouses (id, name, address, updatedAt, isDeleted) VALUES (?, ?, ?, ?, ?)`,
                    [
                        warehouse.id,
                        warehouse.name,
                        warehouse.address || null,
                        warehouse.updatedAt || Date.now(),
                        warehouse.isDeleted || 0,
                    ]
                );
            }
        });
    },

    deleteAll: async (): Promise<void> => {
        await db.runAsync(`DELETE FROM warehouses`);
    },
};
