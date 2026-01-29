import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useAuthStore } from "../../store/auth.store";
import { useOrdersStore } from "../../store/orders.store";

export default function AdminHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const orders = useOrdersStore((s) => s.orders);
  const loadAllOrders = useOrdersStore((s) => s.loadAllOrders);

  useEffect(() => {
    loadAllOrders();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>

      <Text style={styles.text}>
        Адміністратор{user?.email ? `: ${user.email}` : ""}
      </Text>

      <Text style={styles.subtitle}>Усі замовлення</Text>

      {orders.length === 0 && <Text style={styles.empty}>Замовлень немає</Text>}

      {orders.map((order) => (
        <View key={order.id} style={styles.card}>
          <Text>Клієнт: {order.clientEmail}</Text>
          <Text>Статус: {order.status}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  text: {
    fontSize: 18,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  empty: {
    textAlign: "center",
    color: "#999",
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
});
