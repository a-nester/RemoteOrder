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

  saveDraft: () => Promise<void>;
  submitOrder: () => Promise<void>;
  discardDraft: () => void;
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
        await OrdersService.createOrder(finalOrder);
        // If success, update status to synced or similar if we had that status
      } catch (apiError) {
        console.log("Offline mode: Order saved locally, will sync later");
      }

      set({ draft: null, orders: [finalOrder, ...get().orders], loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  discardDraft: () => {
    const { draft } = get();
    if (draft) {
      OrdersDb.deleteOrder(draft.id);
      set({ draft: null });
    }
  }
}));
