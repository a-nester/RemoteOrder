import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useAuthStore } from "../../store/auth.store";
import WarehouseListScreen from "./WarehouseListScreen";
import ProductsScreen from "../common/ProductsScreen";
import PriceDocumentsListScreen from "./price-documents/PriceDocumentsListScreen";
import PriceDocumentEditorScreen from "./price-documents/PriceDocumentEditorScreen";
import PriceEditorScreen from "./PriceEditorScreen";
import PriceTypesScreen from "./PriceTypesScreen";

type Screen = "menu" | "warehouses" | "products" | "priceEditor" | "priceTypes" | "priceDocuments" | "priceDocumentEditor";

export default function AdminHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(undefined);

  if (currentScreen === "warehouses") {
    return <WarehouseListScreen onBack={() => setCurrentScreen("menu")} />;
  }

  if (currentScreen === "products") {
    // role="admin" allows editing prices if implemented in ProductsScreen (it navigates to ProductEditScreen)
    // The user wanted "Setting prices".
    return <ProductsScreen onBack={() => setCurrentScreen("menu")} role="admin" />;
  }

  if (currentScreen === "priceEditor") {
      return (
        <PriceEditorScreen 
            onBack={() => setCurrentScreen("menu")} 
            onNavigateToPriceTypes={() => setCurrentScreen("priceTypes")}
            onNavigateToProducts={() => setCurrentScreen("products")}
        />
      );
  }

  if (currentScreen === "priceTypes") {
      return <PriceTypesScreen onBack={() => setCurrentScreen("priceEditor")} />;
  }

  if (currentScreen === "priceDocuments") {
      return (
        <PriceDocumentsListScreen 
            onBack={() => setCurrentScreen("menu")}
            onCreateDocument={() => {
                setSelectedDocumentId(undefined);
                setCurrentScreen("priceDocumentEditor");
            }}
            onSelectDocument={(doc) => {
                setSelectedDocumentId(doc.id);
                setCurrentScreen("priceDocumentEditor");
            }}
        />
      );
  }

  if (currentScreen === "priceDocumentEditor") {
      return (
        <PriceDocumentEditorScreen
            onBack={() => setCurrentScreen("priceDocuments")}
            documentId={selectedDocumentId}
        />
      );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>

      <Text style={styles.text}>
        Ви увійшли як: {user?.email}
      </Text>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setCurrentScreen("warehouses")}
      >
        <Text style={styles.menuItemText}>🏢 Управління складами</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setCurrentScreen("products")}
      >
        <Text style={styles.menuItemText}>📦 Список товарів</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setCurrentScreen("priceDocuments")}
      >
        <Text style={styles.menuItemText}>📝 Журнал установки цін (Documents)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setCurrentScreen("priceEditor")}
      >
        <Text style={styles.menuItemText}>💲 Редактор цін (Old)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    color: "#666",
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
    textAlign: "center",
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
