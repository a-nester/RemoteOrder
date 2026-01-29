import { create } from "zustand";
import { Order } from "../models/Order";

type OrdersState = {
  orders: Order[];

  loadOrdersByClient: (clientEmail: string) => void;
  loadAllOrders: () => void;

  addOrder: (order: Order) => void;
  clear: () => void;
};

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],

  loadOrdersByClient: (clientEmail) => {
    // MOCK: далі тут буде SQLite
    const filtered = get().orders.filter(
      (o) => o.clientEmail === clientEmail,
    );

    set({ orders: filtered });
  },

  loadAllOrders: () => {
    // MOCK: для адміна
    set({ orders: get().orders });
  },

  addOrder: (order) => {
    set((state) => ({
      orders: [...state.orders, order],
    }));
  },

  clear: () => set({ orders: [] }),
}));
