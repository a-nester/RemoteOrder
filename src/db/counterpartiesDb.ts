
import * as SQLite from "expo-sqlite";
import { Counterparty } from "../types/counterparty";
import { CREATE_COUNTERPARTIES_TABLE } from "./schema";

const db = SQLite.openDatabaseSync("app.db");

export function initCounterpartiesTable() {
    try {
        db.execSync(CREATE_COUNTERPARTIES_TABLE);
        console.log("Counterparties table created/verified successfully.");
    } catch (error) {
        console.error("Failed to create counterparties table:", error);
    }
}

export function getAllCounterparties(includeDeleted = false): Counterparty[] {
    const query = includeDeleted
        ? "SELECT * FROM counterparties ORDER BY name ASC"
        : "SELECT * FROM counterparties WHERE isDeleted = 0 ORDER BY name ASC";

    const rows = db.getAllSync<any>(query);
    return rows.map(row => ({
        ...row,
        isBuyer: !!row.isBuyer,
        isSeller: !!row.isSeller,
        isDeleted: !!row.isDeleted
    }));
}

export function upsertCounterparty(item: Counterparty) {
    db.runSync(
        `INSERT OR REPLACE INTO counterparties (id, name, address, phone, contactPerson, isBuyer, isSeller, priceTypeId, groupId, createdAt, updatedAt, isDeleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            item.id,
            item.name,
            item.address || null,
            item.phone || null,
            item.contactPerson || null,
            item.isBuyer ? 1 : 0,
            item.isSeller ? 1 : 0,
            item.priceTypeId || null,
            item.groupId || null,
            item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
            item.updatedAt ? new Date(item.updatedAt).getTime() : Date.now(),
            0 // isDeleted default 0 for upsert
        ]
    );
}

export function deleteCounterparty(id: string) {
    db.runSync("UPDATE counterparties SET isDeleted = 1 WHERE id = ?", [id]);
}

export function bulkUpsertCounterparties(items: Counterparty[]) {
    db.withTransactionSync(() => {
        for (const item of items) {
            upsertCounterparty(item);
        }
    });
}
