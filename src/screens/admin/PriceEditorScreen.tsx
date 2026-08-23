import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  onBack: () => void;
  onNavigateToPriceTypes?: () => void;
  onNavigateToProducts?: () => void;
  onNavigate?: (screen: string) => void;
}

export default function PriceEditorScreen({ onBack, onNavigateToPriceTypes, onNavigateToProducts, onNavigate }: Props) {
  const handlePriceTypes = onNavigateToPriceTypes || (() => onNavigate?.("priceTypes"));
  const handleProducts = onNavigateToProducts || (() => onNavigate?.("priceDocuments"));
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Редактор цін</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.menuItem} onPress={handlePriceTypes}>
            <Text style={styles.icon}>🏷️</Text>
            <View>
                <Text style={styles.menuTitle}>Типи цін</Text>
                <Text style={styles.menuSubtitle}>Створення та редагування категорій (Опт, VIP)</Text>
            </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleProducts}>
            <Text style={styles.icon}>💰</Text>
            <View>
                <Text style={styles.menuTitle}>Встановлення цін</Text>
                <Text style={styles.menuSubtitle}>Редагування цін для товарів</Text>
            </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
        backgroundColor: "#F5F7FA",
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "500",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
      fontSize: 32,
      marginRight: 16,
  },
  menuTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#1E293B",
      marginBottom: 4,
  },
  menuSubtitle: {
      fontSize: 14,
      color: "#64748B",
  },
});
