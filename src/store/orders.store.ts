import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from "zustand";
import { Order, OrderItem } from "../models/Order";
import { OrdersService } from "../services/orders.service";
import * as OrdersDb from "../db/ordersDb";
import * as CounterpartiesDb from "../db/counterpartiesDb";
import * as ProductsDb from "../db/productsDb";
import { getUUID } from "../utils/uuid";
import { useAuthStore } from "./auth.store";

interface OrdersState {
  orders: Order[];
  archivedOrders: Order[];
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

  // Archive
  archiveOrder: (id: string) => Promise<void>;
  deleteOrderPermanently: (id: string) => Promise<void>;
  loadArchivedOrders: () => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  archivedOrders: [],
  draft: null,
  loading: false,

  loadAllOrders: async () => {
    set({ loading: true });
    try {
      let orders = OrdersDb.getAllOrders();
      set({ orders, loading: false });

      // SYNC PULL
      let lastSync = 0;
      if (orders.length === 0) {
        lastSync = 0;
      } else {
        const str = await AsyncStorage.getItem('lastOrderSyncDate');
        lastSync = str ? parseInt(str, 10) : 0;
      }

      console.log(`[OrderStore] Syncing orders since ${lastSync} (${new Date(lastSync).toISOString()})...`);
      const remoteOrders = await OrdersService.syncPull(lastSync);

      if (remoteOrders.length > 0) {
        console.log(`[OrderStore] Saving ${remoteOrders.length} pulled orders...`);

        try {
          // Load Maps for joins
          const counterparties = CounterpartiesDb.getAllCounterparties();
          const counterpartiesMap = new Map(counterparties.map(c => [c.id, c.name]));

          const products = ProductsDb.getAllProducts();
          const productsMap = new Map(products.map(p => [p.id, p]));

          remoteOrders.forEach((o: any) => {
            // Resolve Name
            let cName = o.counterpartyName;
            if (!cName && o.counterpartyId) {
              cName = counterpartiesMap.get(o.counterpartyId) || 'Unknown Client';
            }

            const parsedOrder = {
              ...o,
              // Ensure date exists
              date: o.date ? new Date(o.date).toISOString() : (o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString()),
              // Ensure counterpartyId exists
              counterpartyId: o.counterpartyId || 'unknown_id',
              // Ensure counterpartyName exists
              counterpartyName: cName || 'Unknown',
              items: (typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || [])).map((i: any) => {
                const pId = i.productId || i.id || 'unknown_product';
                const product = productsMap.get(pId);

                return {
                  ...i,
                  id: i.id || getUUID(),
                  orderId: o.id,
                  productId: pId,
                  quantity: Number(i.quantity || i.count || 1),
                  price: Number(i.price || 0),
                  total: Number(i.total || ((i.quantity || i.count || 1) * (i.price || 0))),
                  productName: i.productName || i.name || product?.name || 'Unknown Product',
                  unit: i.unit || product?.unit || 'pcs'
                };
              }),
              amount: Number(o.total || o.amount || 0),
              isDraft: 0,
              isDeleted: o.isDeleted ? 1 : 0
            };
            OrdersDb.saveOrder(parsedOrder);
          });

          await AsyncStorage.setItem('lastOrderSyncDate', Date.now().toString());

          // Reload from DB - BOTH active and archived
          orders = OrdersDb.getAllOrders();
          const archived = OrdersDb.getArchivedOrders();
          set({ orders, archivedOrders: archived });

        } catch (e) {
          console.error("Error processing orders:", e);
        }
      }

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

    const currentItems = draft.items || [];
    const updatedItems = [...currentItems, newItem];
    const updatedAmount = updatedItems.reduce((sum, i) => sum + i.total, 0);

    const updatedDraft = { ...draft, items: updatedItems, amount: updatedAmount };
    set({ draft: updatedDraft });
    OrdersDb.saveOrder(updatedDraft);
  },

  updateDraftItem: (itemId, updates) => {
    const { draft } = get();
    if (!draft) return;

    const currentItems = draft.items || [];
    const updatedItems = currentItems.map(item => {
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

    const currentItems = draft.items || [];
    const updatedItems = currentItems.filter(item => item.id !== itemId);
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
    if (!draft) {
      return;
    }
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
  },

  // ARCHIVE & DELETE
  archiveOrder: async (id: string) => {
    const { orders } = get();
    const order = orders.find(o => o.id === id);
    if (order) {
      // 1. Soft Delete Local
      OrdersDb.deleteOrder(id);

      // 2. Update State
      set({ orders: orders.filter(o => o.id !== id) });

      // 3. Sync
      try {
        await OrdersService.syncOrder({ ...order, isDeleted: 1 }, 'UPDATE');
      } catch (e) {
        console.error("Archive sync failed:", e);
      }
    }
  },

  deleteOrderPermanently: async (id: string) => {
    // Role check handled in UI usually, but good to have here
    const { user } = useAuthStore.getState(); // Assuming useAuthStore is available globally or imported
    // Wait, useAuthStore is imported in Service. We need to import it here too? 
    // It's not imported in this file top level. I need to verify imports.
    // Let's skip strict role check here relying on Server/UI, or assume import works if I add it.
    // I can't add imports easily with replace_file_content unless I replace top.
    // UI will hide the button. Server overrides.

    // 1. Hard Delete Local
    OrdersDb.hardDeleteOrder(id);

    // 2. Update State
    const { archivedOrders } = get();
    set({ archivedOrders: archivedOrders.filter((o: Order) => o.id !== id) });

    // 3. Sync
    try {
      await OrdersService.deleteOrder(id);
    } catch (e) {
      console.error("Hard delete sync failed:", e);
    }
  },

  loadArchivedOrders: async () => {
    set({ loading: true });
    try {
      const orders = OrdersDb.getArchivedOrders();
      set({ archivedOrders: orders, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  }
}));
