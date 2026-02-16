import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/auth.store";
import { Order, OrderStatus } from "../models/Order";

// Mock Data
let MOCK_ORDERS: Order[] = [
  { id: '1', date: '2023-10-25T10:00:00Z', counterpartyId: '101', counterpartyName: 'Tech Solutions Inc.', amount: 1250.00, currency: 'USD', status: "NEW", createdAt: Date.now(), isDraft: 0, items: [] },
  { id: '2', date: '2023-10-26T14:30:00Z', counterpartyId: '102', counterpartyName: 'Green Valley Grocers', amount: 450.50, currency: 'USD', status: "ACCEPTED", createdAt: Date.now(), isDraft: 0, items: [] },
  { id: '3', date: '2023-10-27T09:15:00Z', counterpartyId: '103', counterpartyName: 'City Cafe', amount: 89.99, currency: 'USD', status: "COMPLETED", createdAt: Date.now(), isDraft: 0, items: [] },
  { id: '4', date: '2023-11-01T11:00:00Z', counterpartyId: '101', counterpartyName: 'Tech Solutions Inc.', amount: 2500.00, currency: 'USD', status: "NEW", createdAt: Date.now(), isDraft: 0, items: [] },
  { id: '5', date: '2023-11-02T16:45:00Z', counterpartyId: '104', counterpartyName: 'Mega Corp', amount: 5000.00, currency: 'USD', status: "NEW", createdAt: Date.now(), isDraft: 0, items: [] },
];

export interface OrderFilter {
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const OrdersService = {
  async getClientOrders(email: string) {
    // Keep existing method for client if needed, or deprecate
    const token = useAuthStore.getState().token;
    try {
      const response = await fetch(`${API_URL}/orders?email=${email}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    } catch (e) {
      console.warn("Using mock data due to API failure");
      return MOCK_ORDERS;
    }
  },

  async getOrders(filter: OrderFilter): Promise<Order[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let filtered = [...MOCK_ORDERS];

    if (filter.startDate) {
      filtered = filtered.filter(o => new Date(o.date) >= new Date(filter.startDate!));
    }

    if (filter.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => new Date(o.date) <= end);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(o =>
        o.counterpartyName.toLowerCase().includes(searchLower) ||
        o.id.includes(searchLower)
      );
    }

    // Sort by date desc
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async syncOrder(order: Order) {
    try {
      console.log(`Syncing order ${order.id}...`);
      const syncPayload = {
        userId: '1',
        changes: [
          {
            id: order.id,
            table: 'Order',
            operation: 'INSERT',
            data: {
              counterpartyId: order.counterpartyId,
              status: order.status,
              total: order.amount,
              items: order.items?.map((i: any) => ({
                id: i.productId,
                count: i.quantity,
                price: i.price
              })) || []
            }
          }
        ]
      };

      const response = await fetch(`${API_URL}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncPayload)
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`Order sync failed: ${response.status} ${text}`);
        throw new Error(text);
      }
      console.log(`Synced order ${order.id}`);
    } catch (e) {
      console.error("Order sync exception:", e);
    }
  },

  async createOrder(orderData: any) {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if order exists (Upsert logic for Mock)
    const existingIndex = MOCK_ORDERS.findIndex(o => o.id === orderData.id);
    let finalOrder: Order;
    let operation: 'INSERT' | 'UPDATE';

    if (existingIndex >= 0) {
      // Update existing
      finalOrder = { ...MOCK_ORDERS[existingIndex], ...orderData, updatedAt: Date.now() };
      MOCK_ORDERS[existingIndex] = finalOrder;
      operation = 'UPDATE';
    } else {
      // Create new
      finalOrder = {
        id: orderData.id || Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        status: "NEW",
        counterpartyId: orderData.counterpartyId || '',
        counterpartyName: orderData.counterpartyName || 'Unknown',
        amount: orderData.amount || 0,
        currency: 'USD',
        createdAt: Date.now(),
        ...orderData
      };
      MOCK_ORDERS.push(finalOrder);
      operation = 'INSERT';
    }

    // SYNC TO SERVER (Background)
    const syncPayload = {
      userId: '1',
      changes: [
        {
          id: finalOrder.id,
          operation: operation,
          data: {
            counterpartyId: finalOrder.counterpartyId,
            status: finalOrder.status,
            total: finalOrder.amount,
            items: finalOrder.items?.map((i: any) => ({
              id: i.productId,
              count: i.quantity,
              price: i.price
            })) || []
          }
        }
      ]
    };

    // Use API_URL from imports
    fetch(`${API_URL}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncPayload)
    }).catch(err => console.log("Background sync failed (Offline?):", err));

    return finalOrder;
  },
};
