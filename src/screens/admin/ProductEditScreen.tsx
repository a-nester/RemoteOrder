import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from "expo-image-picker";
import { PriceType } from "../../types/priceType";
import { getAllPriceTypes } from "../../db/productsDb";
import { Product } from "../../types/product";
import { ProductsService } from "../../services/products.service";
import { ImageService } from "../../services/image.service";
import { useProductsStore } from "../../store/products.store";
import { PriceChangeModal } from "./components/PriceChangeModal";
import { PriceHistoryList } from "./components/PriceHistoryList";
import { PriceHistoryEntry } from "../../types/priceHistory";

interface Props {
  product?: Product;
  onBack: () => void;
  onSave: () => void;
}

export default function ProductEditScreen({ product: initialProduct, onBack, onSave }: Props) {
  const isEditing = !!initialProduct;
  
  // Use store to get live product updates if editing
  const liveProduct = useProductsStore(state => 
    initialProduct ? state.products.find(p => p.id === initialProduct.id) : undefined
  );

  // Fallback to initialProduct if liveProduct undefined (shouldn't happen if id exists)
  const product = liveProduct || initialProduct;

  const [name, setName] = useState(product?.name || "");
  
  // Load available price types
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);

  useEffect(() => {
      // Filter out 'standard' to avoid duplication with hardcoded field
      const allTypes = getAllPriceTypes();
      setPriceTypes(allTypes.filter(pt => pt.slug !== 'standard'));
  }, []);

  // Copy prices object or init default
  const [prices, setPrices] = useState<Record<string, string>>(
    product?.prices 
      ? Object.entries(product.prices).reduce((acc, [k, v]) => {
          acc[k] = v.toString();
          return acc;
        }, {} as Record<string, string>)
      : { standard: "0" }
  );

  // Sync prices when product updates (e.g. after background sync)
  useEffect(() => {
      if (product?.prices) {
          const newPrices = Object.entries(product.prices).reduce((acc, [k, v]) => {
              acc[k] = v.toString();
              return acc;
          }, {} as Record<string, string>);
          setPrices(prev => ({ ...prev, ...newPrices }));
      }
  }, [product]);

  const [unit, setUnit] = useState(product?.unit || "шт");
  const [category, setCategory] = useState(product?.category || "Інше");

  const [imageUri, setImageUri] = useState<string | null>(product?.localImagePath || null);
  const [loading, setLoading] = useState(false);
  const sync = useProductsStore(s => s.sync);

  // Price History Logic
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string>('standard');
  const [selectedPriceName, setSelectedPriceName] = useState<string>('Standard');

  useEffect(() => {
      if (product?.id) {
          fetchHistory();
      }
  }, [product?.id]);

  const fetchHistory = async () => {
      if (!product?.id) return;
      try {
          setHistoryLoading(true);
          const data = await ProductsService.getProductPriceHistory(product.id);
          setHistory(data);
      } catch (e) {
          console.error("Failed to load history", e);
      } finally {
          setHistoryLoading(false);
      }
  };

  const openPriceModal = (slug: string, name: string) => {
      if (!isEditing) {
          Alert.alert("Save First", "Please save the product before adding journal entries.");
          return;
      }
      setSelectedSlug(slug);
      setSelectedPriceName(name);
      setModalVisible(true);
  };

  const handlePriceJournalSave = async (newPrice: number, reason: string) => {
      if (!product?.id) return;
            // Find priceTypeId for the slug (if not standard)
      let priceTypeId: string | undefined;
      if (selectedSlug !== 'standard') {
          const type = priceTypes.find(pt => pt.slug === selectedSlug);
          priceTypeId = type?.id;
      }

      await ProductsService.setProductPrice(product.id, newPrice, priceTypeId, reason);
      
      // Update local state UI
      setPrices(prev => ({ ...prev, [selectedSlug]: newPrice.toString() }));
      
      // Refresh history
      fetchHistory();
      // Sync in background to update local DB fully?
      sync();
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // key-value pairs back to numbers
      const numericPrices: Record<string, number> = {};
      Object.entries(prices).forEach(([k, v]) => {
          const num = parseFloat(v);
          if (!isNaN(num)) numericPrices[k] = num;
      });

      if (isEditing && product) {
          const updatedProduct: Product = {
            ...product,
            name,
            prices: numericPrices,
            unit,
            category,
          };
          
          // Only upload if image uri has changed from the initial local path
          const hasNewImage = imageUri && imageUri !== product.localImagePath;
          
          await ProductsService.updateProduct(updatedProduct, hasNewImage ? imageUri : undefined);
      } else {
          // Create Mode
          const newProduct = {
              name,
              prices: numericPrices,
              unit,
              category,
          };
          await ProductsService.createProduct(newProduct, imageUri || undefined);
      }
      
      // Trigger sync to update local DB and UI
      await sync();
      
      Alert.alert("Success", `Product ${isEditing ? "updated" : "created"} successfully`);
      onSave();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    
    Alert.alert(
        "Delete Product",
        "Are you sure you want to delete this product?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        setLoading(true);
                        await ProductsService.deleteProduct(product.id);
                        await sync();
                        onSave(); // Close screen
                    } catch (error: any) {
                        Alert.alert("Error", error.message);
                        setLoading(false);
                    }
                }
            }
        ]
    );
  };

  const handlePickImage = async () => {
      try {
        console.log("Requesting permissions...");
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
            return;
        }

        console.log("Launching image library...");
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images', // Use string literal to avoid Enum issues
            allowsEditing: false, 
            quality: 0.8,
        });

        console.log("Image picker result:", result.canceled ? "Canceled" : "Picked");

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
      } catch (error: any) {
          console.error("Image Picker Error:", error);
          Alert.alert("Error", "Failed to open image picker: " + error.message);
      }
  };

  const handleDeleteImage = async () => {
      if (isEditing && product) {
        try {
            setLoading(true);
            await ProductsService.deleteProductImage(product.id);
            setImageUri(null);
            await ImageService.deleteImage(product.id); // delete local
            await sync();
        } catch (error: any) {
            Alert.alert("Error deleting image", error.message);
        } finally {
            setLoading(false);
        }
      } else {
          // Create mode
          setImageUri(null);
      }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? "Edit Product" : "New Product"}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Image Section */}
        <View style={styles.imageSection}>
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.productImage} />
            ) : (
                <View style={styles.placeholderImage}>
                    <Text>No Image</Text>
                </View>
            )}
            <View style={styles.imageControls}>
                <TouchableOpacity style={styles.imgBtn} onPress={handlePickImage}>
                    <Text style={styles.imgBtnText}>{imageUri ? "Change Photo" : "Add Photo"}</Text>
                </TouchableOpacity>
                {imageUri && (
                    <TouchableOpacity style={[styles.imgBtn, styles.deleteBtn]} onPress={handleDeleteImage}>
                        <Text style={[styles.imgBtnText, styles.deleteText]}>Delete Photo</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Product Name"
        />

        <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Unit</Text>
                <TextInput
                    style={styles.input}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="kg, pcs, etc."
                />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                    style={styles.input}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="Category"
                />
            </View>
        </View>

        <Text style={styles.sectionTitle}>Prices</Text>
        <Text style={styles.helperText}>Use "Log Change" to record an official price change with a reason.</Text>
        
        {/* Render Standard Price - always active */}
        <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>standard</Text>
            <TextInput
                style={styles.priceInput}
                value={prices["standard"]?.toString() || ""}
                onChangeText={(text) => setPrices(prev => ({ ...prev, standard: text }))}
                keyboardType="numeric"
                placeholder="0"
            />
            {isEditing && (
                <TouchableOpacity style={styles.logChangeBtn} onPress={() => openPriceModal('standard', 'Standard')}>
                    <Text style={styles.logChangeText}>Log Change</Text>
                </TouchableOpacity>
            )}
        </View>

        {/* Render Dynamic Price Types */}
        {priceTypes.map((pt) => (
            <View key={pt.id} style={styles.priceRow}>
                <Text style={styles.priceLabel}>{pt.name} ({pt.slug})</Text>
                <TextInput
                    style={styles.priceInput}
                    value={prices[pt.slug]?.toString() || ""}
                    onChangeText={(text) => setPrices(prev => ({ ...prev, [pt.slug]: text }))}
                    keyboardType="numeric"
                    placeholder="0"
                />
                 {isEditing && (
                    <TouchableOpacity style={styles.logChangeBtn} onPress={() => openPriceModal(pt.slug, pt.name)}>
                        <Text style={styles.logChangeText}>Log Change</Text>
                    </TouchableOpacity>
                )}
            </View>
        ))}

        {isEditing && (
            <View style={styles.historySection}>
                {historyLoading ? (
                    <ActivityIndicator />
                ) : (
                    <PriceHistoryList history={history} priceTypes={priceTypes} />
                )}
            </View>
        )}

        {isEditing && (
            <TouchableOpacity style={styles.deleteProductBtn} onPress={handleDeleteProduct}>
                <Text style={styles.deleteProductText}>Delete Product</Text>
            </TouchableOpacity>
        )}

      </ScrollView>

      {/* Modal for Price Journal */}
      <Modal visible={modalVisible} transparent animationType="slide">
            <PriceChangeModal 
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handlePriceJournalSave}
                currentPrice={Number(prices[selectedSlug] || 0)}
                priceTypeName={selectedPriceName}
            />
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingTop: 45, // Hardcoded generous padding for safety
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#64748B",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 16,
    fontSize: 16,
  },
  sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginTop: 8,
      marginBottom: 4,
  },
  helperText: {
      fontSize: 12,
      color: "#64748B",
      marginBottom: 12,
  },
  priceRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 8,
  },
  priceLabel: {
      flex: 1,
      fontSize: 16,
      color: "#333",
  },
  priceInput: {
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#CBD5E1",
      borderRadius: 8,
      padding: 8,
      width: 100,
      textAlign: "right",
  },
  logChangeBtn: {
      backgroundColor: "#E0F2FE",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#BAE6FD",
  },
  logChangeText: {
      color: "#0369A1",
      fontSize: 12,
      fontWeight: '600',
  },
  historySection: {
      marginTop: 24,
  },
  imageSection: {
      alignItems: "center",
      marginBottom: 24,
  },
  productImage: {
      width: 150,
      height: 150,
      borderRadius: 12,
      marginBottom: 12,
  },
  placeholderImage: {
      width: 150,
      height: 150,
      borderRadius: 12,
      marginBottom: 12,
      backgroundColor: "#E2E8F0",
      justifyContent: "center",
      alignItems: "center",
  },
  imageControls: {
      flexDirection: "row",
      gap: 12,
  },
  imgBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#CBD5E1",
      borderRadius: 8,
  },
  imgBtnText: {
      fontWeight: "500",
      color: "#334155",
  },
  deleteBtn: {
      borderColor: "#EF4444",
  },
  deleteText: {
      color: "#EF4444",
  },
  deleteProductBtn: {
      marginTop: 40,
      padding: 16,
      backgroundColor: "#FEF2F2",
      borderWidth: 1,
      borderColor: "#EF4444",
      borderRadius: 8,
      alignItems: "center",
  },
  deleteProductText: {
      color: "#EF4444",
      fontWeight: "600",
      fontSize: 16,
  },
  row: {
      flexDirection: "row",
  }
});
