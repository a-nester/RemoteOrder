import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/auth.store";

export const OrdersService = {
  async getClientOrders(email: string) {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/orders?email=${email}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch orders");
    return response.json();
  },

  async createOrder(orderData: any) {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    if (!response.ok) throw new Error("Failed to create order");
    return response.json();
  },
};
