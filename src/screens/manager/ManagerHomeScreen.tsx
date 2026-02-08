import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useAuthStore } from "../../store/auth.store";
import CreateOrderScreen from "./CreateOrderScreen";
import OrderListScreen from "./OrderListScreen";
import WarehouseScreen from "./WarehouseScreen";
import ProductsScreen from "../common/ProductsScreen";

type Screen = "menu" | "create_order" | "order_list" | "warehouse" | "products";

export default function ManagerHomeScreen() {
  const logout = useAuthStore((s) => s.logout);
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");

  const renderScreen = () => {
    switch (currentScreen) {
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
            <Text style={styles.title}>Manager Home</Text>

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
              <Text style={styles.logoutText}>Log out</Text>
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
