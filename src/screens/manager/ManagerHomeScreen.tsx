import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth.store";
import { useWarehouseStore } from "../../store/warehouse.store";
import CreateOrderScreen from "./CreateOrderScreen";
import OrderListScreen from "./OrderListScreen";
import WarehouseScreen from "./WarehouseScreen";
import ProductsScreen from "../common/ProductsScreen";
import CollectionPlannerScreen from "../common/CollectionPlannerScreen";

type Screen = "menu" | "create_order" | "order_list" | "warehouse" | "products" | "collection_planner";

export default function ManagerHomeScreen() {
  const logout = useAuthStore((s) => s.logout);
  const loadWarehouses = useWarehouseStore((s) => s.loadWarehouses);
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");

  useEffect(() => {
      loadWarehouses();
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case "collection_planner":
        return (
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen("menu")}>
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Планувальник візитів</Text>
            </View>
            <CollectionPlannerScreen />
          </View>
        );
      case "create_order":
        return <CreateOrderScreen onBack={() => setCurrentScreen("menu")} />;
      case "order_list":
        return <OrderListScreen onBack={() => setCurrentScreen("menu")} />;
      case "warehouse":
        return <WarehouseScreen onBack={() => setCurrentScreen("menu")} />;
      case "products":
        return <ProductsScreen onBack={() => setCurrentScreen("menu")} role="manager" />;
      default:
        return (
          <View style={styles.menuContainer}>
            <Text style={styles.title}>Кабінет Менеджера</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setCurrentScreen("collection_planner")}
            >
              <Text style={styles.menuItemText}>📅 Планувальник візитів</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setCurrentScreen("create_order")}
            >
              <Text style={styles.menuItemText}>1. Створити нове замовлення</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setCurrentScreen("order_list")}
            >
              <Text style={styles.menuItemText}>2. Список замовлень</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setCurrentScreen("warehouse")}
            >
              <Text style={styles.menuItemText}>3. Товари на складі</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setCurrentScreen("products")}
            >
              <Text style={styles.menuItemText}>4. Каталог товарів</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Вийти</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  menuContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  menuItem: {
    padding: 20,
    backgroundColor: "#f0f0f0",
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: "500",
  },
  logoutButton: {
    marginTop: 40,
    alignSelf: "center",
    padding: 10,
  },
  logoutText: {
    color: "red",
    fontSize: 16,
  },
});
