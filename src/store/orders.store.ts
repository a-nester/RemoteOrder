import { create } from "zustand";
import { Order, OrderItem } from "../models/Order";
import { OrdersService } from "../services/orders.service";
import * as OrdersDb from "../db/ordersDb";
import { getUUID } from "../utils/uuid";

interface OrdersState {
  orders: Order[];
  draft: Order | null;
  loading: boolean;

  loadAllOrders: () => Promise<void>;

  // Draft Actions
  initDraft: (counterparty: { id: string, name: string }, clientEmail?: string) => void;
  loadDraft: (draftId: string) => void; // Load existing draft
  setDraft: (order: Order) => void;

  addItemToDraft: (item: Omit<OrderItem, "id" | "orderId" | "total">) => void;
  updateDraftItem: (itemId: string, updates: Partial<OrderItem>) => void;
  removeDraftItem: (itemId: string) => void;
  updateDraftComment: (comment: string) => void;
  updateDraftCounterparty: (counterparty: { id: string, name: string }) => void;

  saveDraft: () => Promise<void>;
  submitOrder: () => Promise<void>;
  discardDraft: () => void;
  loadOrderForEditing: (order: Order) => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  draft: null,
  loading: false,

  loadAllOrders: async () => {
    set({ loading: true });
    try {
      const orders = OrdersDb.getAllOrders();
      // optionally fetch from API and merge/update
      set({ orders, loading: false });

      // Attempt to sync all local orders to server to ensure consistency
      // This acts as our "retry" mechanism for offline orders
      setTimeout(() => {
        console.log(`Attempting to sync ${orders.length} orders...`);
        orders.forEach(o => OrdersService.syncOrder(o));
      }, 2000);

    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  initDraft: (counterparty, clientEmail) => {
    const newDraft: Order = {
      id: getUUID(),
      date: new Date().toISOString(),
      counterpartyId: counterparty.id,
      counterpartyName: counterparty.name,
      amount: 0,
      currency: 'UAH', // Default
      status: 'NEW',
      createdAt: Date.now(),
      clientEmail: clientEmail,
      isDraft: 1,
      items: []
    };
    set({ draft: newDraft });
    OrdersDb.saveOrder(newDraft); // Initial save
  },

  loadDraft: (draftId) => {
    // Implement loading draft from DB if needed, usually passed via navigation or found in list
    // For now, assuming draft is passed or loaded via other means. 
    // This might need `getDraftById` in DB.
  },

  setDraft: (order) => {
    set({ draft: order });
  },

  addItemToDraft: (itemData) => {
    const { draft } = get();
    if (!draft) return;

    const newItem: OrderItem = {
      id: getUUID(),
      orderId: draft.id,
      ...itemData,
      total: itemData.quantity * itemData.price
    };

    const updatedItems = [...draft.items, newItem];
    const updatedAmount = updatedItems.reduce((sum, i) => sum + i.total, 0);

    const updatedDraft = { ...draft, items: updatedItems, amount: updatedAmount };
    set({ draft: updatedDraft });
    OrdersDb.saveOrder(updatedDraft);
  },

  updateDraftItem: (itemId, updates) => {
    const { draft } = get();
    if (!draft) return;

    const updatedItems = draft.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        // Recalculate total if quantity or price changed
        if (updates.quantity !== undefined || updates.price !== undefined) {
          updatedItem.total = updatedItem.quantity * updatedItem.price;
        }
        return updatedItem;
      }
      return item;
    });

    const updatedAmount = updatedItems.reduce((sum, i) => sum + i.total, 0);
    const updatedDraft = { ...draft, items: updatedItems, amount: updatedAmount };

    set({ draft: updatedDraft });
    OrdersDb.saveOrder(updatedDraft);
  },

  removeDraftItem: (itemId) => {
    const { draft } = get();
    if (!draft) return;

    const updatedItems = draft.items.filter(item => item.id !== itemId);
    const updatedAmount = updatedItems.reduce((sum, i) => sum + i.total, 0);

    const updatedDraft = { ...draft, items: updatedItems, amount: updatedAmount };
    set({ draft: updatedDraft });
    OrdersDb.saveOrder(updatedDraft);
  },

  updateDraftComment: (comment) => {
    const { draft } = get();
    if (!draft) return;
    const updatedDraft = { ...draft, comment };
    set({ draft: updatedDraft });
    OrdersDb.saveOrder(updatedDraft);
  },

  updateDraftCounterparty: (counterparty) => {
    const { draft } = get();
    if (!draft) return;
    const updatedDraft = {
      ...draft,
      counterpartyId: counterparty.id,
      counterpartyName: counterparty.name
    };
    set({ draft: updatedDraft });
    OrdersDb.saveOrder(updatedDraft);
  },

  saveDraft: async () => {
    const { draft } = get();
    if (draft) {
      OrdersDb.saveOrder(draft);
    }
  },

  submitOrder: async () => {
    const { draft } = get();
    if (!draft) return;

    set({ loading: true });
    try {
      // 1. Mark as not draft
      const finalOrder = { ...draft, isDraft: 0, status: 'NEW' as const };

      // 2. Save locally as final
      OrdersDb.saveOrder(finalOrder);

      // 3. Try sending to API
      try {
        console.log(`[SubmitOrder] Attempting immediate sync for ${finalOrder.id}`);
        await OrdersService.syncOrder(finalOrder, 'INSERT');
        console.log(`[SubmitOrder] Immediate sync success`);
      } catch (apiError) {
        console.error("[SubmitOrder] API Sync failed (Offline?):", apiError);
      }

      set((state) => {
        const existingIndex = state.orders.findIndex(o => o.id === finalOrder.id);
        let newOrders;
        if (existingIndex >= 0) {
          newOrders = [...state.orders];
          newOrders[existingIndex] = finalOrder;
        } else {
          newOrders = [finalOrder, ...state.orders];
        }
        return { draft: null, orders: newOrders, loading: false };
      });
    } catch (e) {
      console.error("[SubmitOrder] Critical error:", e);
      set({ loading: false });
    }
  },

  discardDraft: () => {
    const { draft } = get();
    if (draft) {
      OrdersDb.deleteOrder(draft.id);
      set({ draft: null });
    }
  },

  loadOrderForEditing: (order: Order) => {
    // 1. Get Items
    const items = OrdersDb.getOrderItems(order.id);

    // 2. Set as Draft (keep existing isDraft status or set to 1 if we want to treat as draft?)
    // For now, let's keep it as is, so it doesn't disappear from the list if it was 0.
    // But we need to ensure UI knows we are editing.
    set({ draft: { ...order, items } });
  }
}));
