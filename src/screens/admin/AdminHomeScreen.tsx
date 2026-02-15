import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"; 
import { useState } from "react";
import { useAuthStore } from "../../store/auth.store";
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

type Screen = "menu" | "warehouses" | "products" | "priceEditorMenu" | "priceTypes" | "priceDocuments" | "priceDocumentEditor" | "settings" | "counterparties" | "counterpartyEdit" | "orders";

export default function AdminHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>(undefined);
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

  if (currentScreen === "counterparties") {
      return (
          <CounterpartiesListScreen 
              onBack={() => setCurrentScreen("menu")} 
              onEdit={(cp) => {
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
              onBack={() => setCurrentScreen("counterparties")}
              counterparty={selectedCounterparty}
          />
      );
  }

  if (currentScreen === "orders") {
      return <OrdersScreen onBack={() => setCurrentScreen("menu")} />;
  }

  if (currentScreen === "settings") {
      return (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
              <View style={[styles.header, { paddingTop: insets.top + 10, paddingHorizontal: 16 }]}>
                  <TouchableOpacity onPress={() => setCurrentScreen("menu")} style={styles.backButton}>
                      <Ionicons name="arrow-back" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>{t('settings.title')}</Text>
              </View>
              <SettingsScreen />
          </View>
      );
  }

  if (currentScreen === "priceEditorMenu") {
      return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
             <View style={[styles.header, { paddingTop: insets.top + 10, paddingHorizontal: 16 }]}>
                  <TouchableOpacity onPress={() => setCurrentScreen("menu")} style={styles.backButton}>
                      <Ionicons name="arrow-back" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>{t('menu.priceEditor')}</Text>
              </View>
            
            <View style={{ padding: 16 }}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setCurrentScreen("priceDocuments")}
                >
                    <Text style={styles.menuItemText}>📝 {t('menu.priceSettings')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setCurrentScreen("priceTypes")}
                >
                    <Text style={styles.menuItemText}>🏷️ {t('menu.priceTypes')}</Text>
                </TouchableOpacity>
            </View>
        </View>
      )
  }

  if (currentScreen === "priceTypes") {
      return <PriceTypesScreen onBack={() => setCurrentScreen("priceEditorMenu")} />;
  }

  if (currentScreen === "priceDocuments") {
      return (
        <PriceDocumentsListScreen 
            onBack={() => setCurrentScreen("priceEditorMenu")}
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
      <Text style={styles.title}>RemoteOrder</Text>

      <Text style={styles.text}>
        {user?.email} ({user?.role})
      </Text>
      
      <ScrollView contentContainerStyle={styles.menuContainer}>
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
            onPress={() => setCurrentScreen("orders")}
        >
            <Text style={styles.menuItemText}>🛒 {t('menu.orders')}</Text>
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
      marginBottom: 20,
      paddingTop: 10
  },
  backButton: {
      padding: 10,
      marginRight: 10
  },
  headerTitle: {
      fontSize: 20,
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
