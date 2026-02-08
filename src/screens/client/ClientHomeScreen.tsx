import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useAuthStore } from "../../store/auth.store";
import { useOrdersStore } from "../../store/orders.store";
import { useEffect, useState } from "react";
import CreateOrderScreen from "./CreateOrderScreen";
import ProductsScreen from "../common/ProductsScreen";

type Screen = "menu" | "products";

export default function ClientHomeScreen() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");

  const orders = useOrdersStore((s) => s.orders);
  const loadOrdersByClient = useOrdersStore((s) => s.loadOrdersByClient);

  useEffect(() => {
    if (user?.email) {
      loadOrdersByClient(user.email);
    }
  }, [user?.email]);

  if (currentScreen === "products") {
    return <ProductsScreen onBack={() => setCurrentScreen("menu")} role="client" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Client Home</Text>

      <Text style={styles.text}>
        Вітаю{user?.email ? `, ${user.email}` : ""}
      </Text>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setCurrentScreen("products")}
      >
        <Text style={styles.menuItemText}>🛍 Каталог товарів</Text>
      </TouchableOpacity>

      <CreateOrderScreen />

      <Text style={styles.subtitle}>My Orders:</Text>

      {orders.length === 0 ? (
        <Text style={styles.emptyText}>No orders yet</Text>
      ) : (
        orders.map((o) => (
          <View key={o.id} style={styles.order}>
            <Text style={styles.orderId}>Order #{o.id.slice(0, 8)}</Text>
            <View style={styles.row}>
               <Text>Status:</Text>
               <Text style={[styles.status, { color: getStatusColor(o.status) }]}>
                 {o.status}
               </Text>
            </View>
            <Text style={styles.date}>
              {new Date(o.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "new": return "blue";
    case "in_progress": return "orange";
    case "done": return "green";
    default: return "gray";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },
  text: {
    fontSize: 16,
    marginBottom: 24,
    color: "#444",
  },
  menuItem: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
    color: "#111",
  },
  order: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderId: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  status: {
    fontWeight: "600",
    textTransform: "capitalize",
  },
  date: {
    fontSize: 12,
    color: "#888",
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
  },
  logout: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#EF4444",
    borderRadius: 12,
  },
  logoutText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
