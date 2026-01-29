import { db } from "./database";

export type OrderEntity = {
  id: number;
  title: string;
  status: string;
  clientEmail: string;
};

export const OrdersRepository = {
  getAllByClient(email: string): Promise<OrderEntity[]> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM orders WHERE clientEmail = ?;",
          [email],
          (_, result) => resolve(result.rows._array as OrderEntity[]),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },

  create(order: Omit<OrderEntity, "id">): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          "INSERT INTO orders (title, status, clientEmail) VALUES (?, ?, ?);",
          [order.title, order.status, order.clientEmail],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  },
};
