import { create } from "zustand";
import { Order } from "../types/order";
import { mockOrders } from "../mocks/orders.mock";

interface OrdersState {
  orders: Order[];
  loading: boolean;

  loadAllOrders: () => Promise<void>;
  loadOrdersByClient: (clientEmail: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  loading: false,

  loadAllOrders: async () => {
    set({ loading: true });
    await new Promise((r) => setTimeout(r, 300));
    set({ orders: mockOrders, loading: false });
  },

  loadOrdersByClient: async (clientEmail) => {
    set({ loading: true });
    await new Promise((r) => setTimeout(r, 300));

    const filtered = mockOrders.filter(
      (o) => o.clientEmail === clientEmail
    );

    set({ orders: filtered, loading: false });
  },

  addOrder: async (order) => {
    set({ loading: true });
    await new Promise((r) => setTimeout(r, 200));

    set((state) => ({
      orders: [order, ...state.orders],
      loading: false,
    }));
  },
}));
