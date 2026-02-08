import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Modal,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductsStore } from "../../store/products.store";
import { Product } from "../../types/product";

interface Props {
  onBack: () => void;
  role?: "admin" | "manager" | "client";
}

import ProductEditScreen from "../../screens/admin/ProductEditScreen";
import PriceTypesScreen from "../../screens/admin/PriceTypesScreen";

export default function ProductsScreen({ onBack, role = "client" }: Props) {
  const { products, loading } = useProductsStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isManagingPrices, setIsManagingPrices] = useState(false);

  const sections = useMemo(() => {
    const grouped = products.reduce((acc, product) => {
      const category = product.category || "Інше";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    return Object.keys(grouped)
      .sort()
      .map((category) => ({
        title: category,
        data: grouped[category].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [products]);

  if (isManagingPrices) {
      return (
          <PriceTypesScreen onBack={() => setIsManagingPrices(false)} />
      );
  }

  if (editingProduct || isCreating) {
    return (
      <ProductEditScreen 
        product={editingProduct || undefined} 
        onBack={() => {
            setEditingProduct(null);
            setIsCreating(false);
        }}
        onSave={() => {
            setEditingProduct(null);
            setIsCreating(false);
        }}
      />
    );
  }
  
  // ... renderItem ...

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => {
            if (role === 'admin') {
                setEditingProduct(item);
            }
        }}
        activeOpacity={role === 'admin' ? 0.7 : 1}
      >
        <View style={styles.header}>
            <TouchableOpacity 
                style={styles.imageButton}
                onPress={() => setSelectedImage(item.localImagePath || null)}
            >
                 <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>
            {(item.prices?.standard || Object.values(item.prices)[0] || 0).toFixed(2)} ₴ / {item.unit}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string };
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Товари ({products.length})</Text>
        <View style={{ width: 60, flexDirection: 'row', justifyContent: 'flex-end' }}>
            {role === 'admin' && (
                <TouchableOpacity onPress={() => setIsManagingPrices(true)}>
                    <Text style={{ fontSize: 20 }}>🏷️</Text>
                </TouchableOpacity>
            )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text>Завантаження...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Список товарів порожній</Text>
          }
        />
      )}

      {role === 'admin' && (
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => setIsCreating(true)}
          >
              <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
      )}

      <Modal
        visible={!!selectedImage}
        transparent={true}
        onRequestClose={() => setSelectedImage(null)}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
            <TouchableOpacity 
                style={styles.modalCloseArea} 
                onPress={() => setSelectedImage(null)} 
            />
            <View style={styles.modalContent}>
                {selectedImage ? (
                    <Image 
                        source={{ uri: selectedImage }} 
                        style={styles.fullImage} 
                        resizeMode="contain"
                    />
                ) : (
                     <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>Фото відсутнє</Text>
                     </View>
                )}
                <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setSelectedImage(null)}
                >
                    <Text style={styles.closeButtonText}>Закрити</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  headerContainer: {
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
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    backgroundColor: "#F5F7FA",
    paddingVertical: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#475569",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imageButton: {
      marginRight: 12,
      padding: 4,
      borderRadius: 8,
      backgroundColor: "#E0F2FE", // Light blue background
  },
  cameraIcon: {
      fontSize: 20,
      color: "#0EA5E9", // Blue icon
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 16,
    marginTop: 32,
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "center",
      alignItems: "center",
  },
  modalCloseArea: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
  },
  modalContent: {
      width: width * 0.9,
      height: height * 0.6,
      backgroundColor: "#fff",
      borderRadius: 16,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
  },
  fullImage: {
      width: "100%",
      height: "85%",
  },
  placeholderImage: {
      width: "100%",
      height: "85%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F1F5F9",
  },
  placeholderText: {
      fontSize: 18,
      color: "#64748B",
  },
  closeButton: {
      padding: 16,
      width: "100%",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: "#E2E8F0",
  },
  closeButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#3B82F6",
  },
  fab: {
      position: "absolute",
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#3B82F6",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
  },
  fabText: {
      fontSize: 32,
      color: "#fff",
      marginTop: -4,
  },
});
