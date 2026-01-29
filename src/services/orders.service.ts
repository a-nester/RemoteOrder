import { OrdersRepository } from "../db/orders.repository";

export const OrdersService = {
  async getClientOrders(email: string) {
    return OrdersRepository.getAllByClient(email);
  },

  async createOrder(title: string, email: string) {
    return OrdersRepository.create({
      title,
      status: "new",
      clientEmail: email,
    });
  },
};
