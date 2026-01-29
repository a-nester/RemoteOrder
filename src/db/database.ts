import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabase("remoteorder.db");

export const initDatabase = () => {
  return new Promise<void>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          status TEXT NOT NULL,
          clientEmail TEXT NOT NULL
        );
        `,
        [],
        () => resolve(),
        (_, error) => {
          console.error("DB init error", error);
          reject(error);
          return false;
        }
      );
    });
  });
};
