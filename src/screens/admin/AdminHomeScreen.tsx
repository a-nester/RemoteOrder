import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"; 
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth.store";
import { useOrdersStore } from "../../store/orders.store";
import WarehouseListScreen from "./WarehouseListScreen";
import ProductsScreen from "../common/ProductsScreen";
import PriceDocumentsListScreen from "./price-documents/PriceDocumentsListScreen";
import PriceDocumentEditorScreen from "./price-documents/PriceDocumentEditorScreen";
import PriceEditorScreen from "./PriceEditorScreen";
import PriceTypesScreen from "./PriceTypesScreen";
import { SettingsScreen } from "../common/SettingsScreen";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CounterpartiesListScreen } from "./counterparties/CounterpartiesListScreen";
import { CounterpartyEditScreen } from "./counterparties/CounterpartyEditScreen";
import { Counterparty } from "../../types/counterparty";
import OrdersScreen from "../common/OrdersScreen";
import OrdersArchiveScreen from "../common/OrdersArchiveScreen";
import OrganizationSettingsScreen from "./OrganizationSettingsScreen";
import GoodsReceiptListScreen from "./GoodsReceiptListScreen";
import GoodsReceiptEditScreen from "./GoodsReceiptEditScreen";
import CollectionPlannerScreen from "../common/CollectionPlannerScreen";
import TerritoriesScreen from "./TerritoriesScreen";

type Screen = 
  | "menu" 
  | "warehouses" 
  | "products" 
  | "priceEditorMenu" 
  | "priceTypes" 
  | "priceDocuments" 
  | "priceDocumentEditor" 
  | "settings" 
  | "counterparties" 
  | "counterpartyEdit" 
  | "orders" 
  | "ordersArchive" 
  | "organizationSettings" 
  | "goodsReceipts" 
  | "goodsReceiptEdit"
  | "collectionPlanner"
  | "territories";

export default function AdminHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const loadOrders = useOrdersStore(s => s.loadAllOrders);

  useEffect(() => {
      loadOrders();
  }, []);

  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(undefined);
  const [selectedGoodsReceiptId, setSelectedGoodsReceiptId] = useState<string | undefined>(undefined);
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | undefined>(undefined);
  
  const { t } = useTranslation();
  const { colors } = useTheme();

  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  
  if (currentScreen === "warehouses") {
    return <WarehouseListScreen onBack={() => setCurrentScreen("menu")} />;
  }

  if (currentScreen === "products") {
    return <ProductsScreen onBack={() => setCurrentScreen("menu")} role="admin" />;
  }

  if (currentScreen === "goodsReceipts") {
      return (
          <GoodsReceiptListScreen 
              onBack={() => setCurrentScreen("menu")}
              onCreateDocument={() => {
                  setSelectedGoodsReceiptId(undefined);
                  setCurrentScreen("goodsReceiptEdit");
              }}
              onSelectDocument={(doc) => {
                  setSelectedGoodsReceiptId(doc.id);
                  setCurrentScreen("goodsReceiptEdit");
              }}
          />
      );
  }

  if (currentScreen === "goodsReceiptEdit") {
      return (
          <GoodsReceiptEditScreen
              onBack={() => setCurrentScreen("goodsReceipts")}
              receiptId={selectedGoodsReceiptId}
          />
      );
  }

  if (currentScreen === "organizationSettings") {
    return <OrganizationSettingsScreen onBack={() => setCurrentScreen("menu")} />;
  }

  if (currentScreen === "collectionPlanner") {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen("menu")}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Планувальник візитів</Text>
        </View>
        <CollectionPlannerScreen />
      </View>
    );
  }

  if (currentScreen === "territories") {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen("menu")}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Території</Text>
        </View>
        <TerritoriesScreen />
      </View>
    );
  }

  if (currentScreen === "settings") {
    return <SettingsScreen onBack={() => setCurrentScreen("menu")} />;
  }

  if (currentScreen === "counterparties") {
    return (
      <CounterpartiesListScreen
        onBack={() => setCurrentScreen("menu")}
        onEdit={(cp: Counterparty) => {
          setSelectedCounterparty(cp);
          setCurrentScreen("counterpartyEdit");
        }}
        onCreate={() => {
          setSelectedCounterparty(undefined);
          setCurrentScreen("counterpartyEdit");
        }}
      />
    );
  }

  if (currentScreen === "counterpartyEdit") {
    return (
      <CounterpartyEditScreen
        counterparty={selectedCounterparty}
        onBack={() => setCurrentScreen("counterparties")}
      />
    );
  }

  if (currentScreen === "orders") {
    return <OrdersScreen onBack={() => setCurrentScreen("menu")} role="admin" />;
  }

  if (currentScreen === "ordersArchive") {
    return <OrdersArchiveScreen onBack={() => setCurrentScreen("menu")} />;
  }

  if (currentScreen === "priceEditorMenu") {
    return <PriceEditorScreen onBack={() => setCurrentScreen("menu")} onNavigate={(s) => setCurrentScreen(s as Screen)} />;
  }

  if (currentScreen === "priceTypes") {
    return <PriceTypesScreen onBack={() => setCurrentScreen("priceEditorMenu")} />;
  }

  if (currentScreen === "priceDocuments") {
    return (
      <PriceDocumentsListScreen
        onBack={() => setCurrentScreen("priceEditorMenu")}
        onSelectDocument={(doc) => {
          setSelectedDocumentId(doc.id);
          setCurrentScreen("priceDocumentEditor");
        }}
        onCreateDocument={() => {
          setSelectedDocumentId(undefined);
          setCurrentScreen("priceDocumentEditor");
        }}
      />
    );
  }

  if (currentScreen === "priceDocumentEditor") {
    return (
      <PriceDocumentEditorScreen
        documentId={selectedDocumentId}
        onBack={() => setCurrentScreen("priceDocuments")}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('admin.title', 'Admin Dashboard')}</Text>
      <ScrollView contentContainerStyle={styles.menuContainer}>
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen("collectionPlanner")}
        >
            <Text style={styles.menuItemText}>📅 {t('menu.planner', 'Планувальник візитів')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen("warehouses")}
        >
            <Text style={styles.menuItemText}>🏢 {t('menu.dashboard')} (Warehouses)</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen("products")}
        >
            <Text style={styles.menuItemText}>📦 {t('menu.products')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen("goodsReceipts")}
        >
            <Text style={styles.menuItemText}>📥 {t('menu.goodsReceipt', 'Поступлення')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen("priceEditorMenu")}
        >
            <Text style={styles.menuItemText}>💲 {t('menu.priceEditor')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen("counterparties")}
        >
            <Text style={styles.menuItemText}>👥 {t('menu.counterparties')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen("territories")}
        >
            <Text style={styles.menuItemText}>🗺️ {t('menu.territories', 'Території')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen("orders")}
        >
            <Text style={styles.menuItemText}>🛒 {t('menu.orders')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen("ordersArchive")}
        >
            <Text style={styles.menuItemText}>📁 {t('menu.archive')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen("organizationSettings")}
        >
            <Text style={styles.menuItemText}>🏢 {t('menu.organizationSettings', 'Organization')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen("settings")}
        >
            <Text style={styles.menuItemText}>⚙️ {t('menu.settings')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>{t('menu.signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  menuContainer: {
      paddingBottom: 40,
      justifyContent: "center",
      flexGrow: 1
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 40,
      paddingBottom: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
  },
  backButton: {
      padding: 6,
      marginRight: 10
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    marginTop: 40,
    color: colors.text
  },
  text: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    color: colors.text,
    opacity: 0.7
  },
  menuItem: {
    padding: 20,
    backgroundColor: colors.card,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    color: colors.text
  },
  logoutButton: {
    marginTop: 40,
    alignSelf: "center",
    padding: 10,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 16,
  },
});
