import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useEffect } from "react";
import { useAuthStore } from "../../store/auth.store";
import { useOrdersStore } from "../../store/orders.store";

interface Props {
  onBack: () => void;
}

export default function OrderListScreen({ onBack }: Props) {
  const user = useAuthStore((s) => s.user);
  const orders = useOrdersStore((s) => s.orders);
  const loadAllOrders = useOrdersStore((s) => s.loadAllOrders);

  useEffect(() => {
    loadAllOrders();
  }, []);

  // Filter orders based on manager's warehouse
  const filteredOrders = user?.warehouseId
    ? orders.filter((o) => o.warehouseId === user.warehouseId)
    : orders;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Список замовлень</Text>
      
      {user?.warehouseId && (
        <Text style={styles.subtitle}>Склад: {user.warehouseId}</Text>
      )}

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>Клієнт: {item.clientEmail}</Text>
            <Text>Сума: {item.total}</Text>
            <Text>Статус: {item.status}</Text>
          </View>
        )}
      />

      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Назад</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
  },
  backButton: {
    padding: 15,
    backgroundColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 16,
  },
});
