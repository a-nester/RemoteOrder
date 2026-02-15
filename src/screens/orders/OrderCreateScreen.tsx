
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useOrdersStore } from "../../store/orders.store";
import { Order, OrderItem } from "../../models/Order";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Counterparty } from "../../types/counterparty";
import * as CounterpartiesDb from "../../db/counterpartiesDb";
// ...
import { Product } from "../../types/product";
import { PriceType } from "../../types/priceType";
import * as ProductsDb from "../../db/productsDb"; // Assuming we have DB access

// Mock or import proper service/store for counterparties
// For now, let's use a local fetch or mock
const getCounterparties = async () => {
    // Fetch from Local DB
    return CounterpartiesDb.getAllCounterparties();
};

interface OrderCreateScreenProps {
    onBack: () => void;
    onSaveSuccess: () => void;
}

export default function OrderCreateScreen({ onBack, onSaveSuccess }: OrderCreateScreenProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = getStyles(colors);

    const { 
        draft, 
        initDraft, 
        setDraft,
        addItemToDraft, 
        updateDraftItem, 
        removeDraftItem, 
        updateDraftComment, 
        saveDraft, 
        submitOrder,
        discardDraft 
    } = useOrdersStore();

    // Local state for UI
    const [clients, setClients] = useState<any[]>([]);
    const [clientModalVisible, setClientModalVisible] = useState(false);
    
    const [products, setProducts] = useState<Product[]>([]);
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState("");

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantityModalVisible, setQuantityModalVisible] = useState(false);
    const [quantity, setQuantity] = useState("1");
    const [price, setPrice] = useState("0");
    const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);

    // Initialize Draft on Mount if not exists
    useEffect(() => {
        if (!draft) {
             // Try to load existing draft from DB first? 
             // For now, valid requirement: "create new draft"
             // But if we want to restore "after sudden crash", we should check DB for existing drafts
             // and maybe prompt user or auto-load. 
             // Simplification: We assume the user wants to continue the *latest* draft or create new.
             // Let's create new for now as requested "when creating new document".
             // The autosave handles the crash recovery logic implicitly if we load it on app start.
             // Here we just init a fresh one if null.
             // Wait, if it's "create new", we init new.
             // If we wanted to resume, we'd do it in the list screen.
        }
    }, []);

    // Load Clients
    useEffect(() => {
        getCounterparties().then(setClients);
    }, []);

    // Load Products
    useEffect(() => {
        const prods = ProductsDb.getAllProducts();
        setProducts(prods);
        setFilteredProducts(prods);
    }, []);

    // Load Price Types
    useEffect(() => {
        const types = ProductsDb.getAllPriceTypes();
        setPriceTypes(types);
    }, []);

    const handleSelectClient = (client: any) => {
        if (draft) {
             // Creating new draft happens in initDraft, but here we update existing
             // Use new store action if available or just update draft state manually if simple
             // However, best practice is to use store action
             // Since I added updateDraftCounterparty to store interface in previous step:
             // Note: I must ensure it is available in destructured props
             // Let's assume it is or I need to update the destructuring above
             useOrdersStore.getState().updateDraftCounterparty({ id: client.id, name: client.name });
        } else {
             initDraft({ id: client.id, name: client.name });
        }
        setClientModalVisible(false);
    };

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        
        let initialPrice = 0;
        
        if (draft && draft.counterpartyId) {
            const currentClient = clients.find(c => c.id === draft.counterpartyId);
            
            if (currentClient && currentClient.priceTypeId && product.prices) {
                // Find slug for the client's price type ID
                const priceType = priceTypes.find(pt => pt.id === currentClient.priceTypeId);
                
                if (priceType && priceType.slug) {
                    const priceKey = priceType.slug;
                    const specificPrice = product.prices[priceKey];
                    
                    if (specificPrice !== undefined) {
                        initialPrice = typeof specificPrice === 'string' ? parseFloat(specificPrice) : specificPrice;
                    } else if ((product.prices as any).standard !== undefined) {
                        initialPrice = typeof (product.prices as any).standard === 'string' ? parseFloat((product.prices as any).standard) : (product.prices as any).standard;
                    }
                } else if ((product.prices as any).standard !== undefined) {
                    initialPrice = (product.prices as any).standard;
                }
            } else if (product.prices && (product.prices as any).standard !== undefined) {
                 initialPrice = (product.prices as any).standard;
            }
        }
        
        setPrice(initialPrice.toString());
        setQuantity("1");
        setProductModalVisible(false);
        setQuantityModalVisible(true);
    };

    const handleAddItem = () => {
        if (selectedProduct) {
            addItemToDraft({
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                quantity: parseFloat(quantity),
                price: parseFloat(price),
                unit: selectedProduct.unit
            });
            setQuantityModalVisible(false);
            setSelectedProduct(null);
        }
    };

    const handleSearchProduct = (text: string) => {
        setProductSearch(text);
        if (!text) {
            setFilteredProducts(products);
        } else {
            const lower = text.toLowerCase();
            setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(lower)));
        }
    };

    const handleSubmit = async () => {
        if (!draft) return;
        if (draft.items.length === 0) {
            Alert.alert(t('common.error'), "Order must have at least one item");
            return;
        }
        await submitOrder();
        onSaveSuccess();
    };

    if (!draft) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.label}>{t('counterparties.title')}:</Text>
                <TouchableOpacity 
                    style={styles.selectButton} 
                    onPress={() => setClientModalVisible(true)}
                >
                    <Text style={styles.selectButtonText}>{t('action.selectClient', 'Select Client')}</Text>
                </TouchableOpacity>

                {/* Client Selection Modal */}
                <Modal visible={clientModalVisible} animationType="slide">
                    <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                        <View style={styles.modalHeader}>
                             <Text style={styles.modalTitle}>{t('action.selectClient', 'Select Client')}</Text>
                             <TouchableOpacity onPress={() => setClientModalVisible(false)}>
                                 <Ionicons name="close" size={24} color={colors.text} />
                             </TouchableOpacity>
                        </View>
                        <FlatList 
                            data={clients}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.listItem} 
                                    onPress={() => handleSelectClient(item)}
                                >
                                    <Text style={styles.listItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </Modal>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {draft.isDraft === 0 ? t('order.edit', 'Edit Order') : t('order.create', 'New Order')}
                </Text>
                <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
                     <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Client Info */}
                <TouchableOpacity style={styles.section} onPress={() => setClientModalVisible(true)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.label}>{t('counterparties.group')}: {draft.counterpartyName}</Text>
                        <Ionicons name="pencil" size={16} color={colors.primary} />
                    </View>
                </TouchableOpacity>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>#</Text>
                        <Text style={[styles.tableHeaderText, { flex: 4 }]}>{t('common.product', 'Product')}</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>{t('common.qty', 'Qty')}</Text>
                        <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>{t('common.sum', 'Sum')}</Text>
                        <View style={{ width: 30 }} />
                    </View>
                    
                    {draft.items.map((item, index) => (
                        <View key={item.id} style={styles.tableRow}>
                            <Text style={[styles.tableText, { flex: 0.5 }]}>{index + 1}</Text>
                            <View style={{ flex: 4 }}>
                                <Text style={styles.tableTextMain}>{item.productName}</Text>
                                <Text style={styles.tableTextSub}>{item.price} x {item.quantity} {item.unit}</Text>
                            </View>
                            <Text style={[styles.tableText, { flex: 1, textAlign: 'right' }]}>{item.quantity}</Text>
                            <Text style={[styles.tableText, { flex: 2, textAlign: 'right' }]}>{item.total.toFixed(2)}</Text>
                            <TouchableOpacity onPress={() => removeDraftItem(item.id)} style={{ width: 30, alignItems: 'center' }}>
                                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                 <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>{t('common.total', 'Total')}:</Text>
                    <Text style={styles.totalValue}>{draft.amount.toFixed(2)} {draft.currency}</Text>
                 </View>

                {/* Comment */}
                <View style={styles.commentContainer}>
                    <TextInput 
                        style={styles.commentInput}
                        placeholder={t('priceDocument.comment')}
                        placeholderTextColor={colors.text + '80'}
                        value={draft.comment || ''}
                        onChangeText={updateDraftComment}
                    />
                </View>

                <TouchableOpacity 
                    style={styles.addProductButton} 
                    onPress={() => setProductModalVisible(true)}
                >
                    <Text style={styles.addProductButtonText}>+ {t('common.addProduct', 'Add Product')}</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} /> 
            </ScrollView>


            {/* Product Selection Modal */}
            <Modal visible={productModalVisible} animationType="slide">
                 <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                        <View style={styles.modalHeader}>
                             <TextInput 
                                style={styles.searchInput}
                                placeholder={t('common.search')}
                                value={productSearch}
                                onChangeText={handleSearchProduct}
                             />
                             <TouchableOpacity onPress={() => setProductModalVisible(false)} style={{ marginLeft: 10 }}>
                                 <Ionicons name="close" size={24} color={colors.text} />
                             </TouchableOpacity>
                        </View>
                        <FlatList 
                            data={filteredProducts}
                            keyExtractor={item => item.id}
                            initialNumToRender={20}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.listItem} 
                                    onPress={() => handleSelectProduct(item)}
                                >
                                    <View>
                                        <Text style={styles.listItemText}>{item.name}</Text>
                                        <Text style={styles.listItemSubText}>{item.unit}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                </View>
            </Modal>

            {/* Quantity Modal */}
            <Modal visible={quantityModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.quantityModal}>
                         <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
                         
                         <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('common.price', 'Price')}</Text>
                            <TextInput 
                                style={styles.input}
                                keyboardType="numeric"
                                value={price}
                                onChangeText={setPrice}
                            />
                         </View>

                         <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('common.quantity', 'Quantity')}</Text>
                            <TextInput 
                                style={styles.input}
                                keyboardType="numeric"
                                value={quantity}
                                onChangeText={setQuantity}
                                autoFocus
                            />
                         </View>

                         <View style={styles.modalActions}>
                             <TouchableOpacity onPress={() => setQuantityModalVisible(false)} style={styles.cancelButton}>
                                 <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                             </TouchableOpacity>
                             <TouchableOpacity onPress={handleAddItem} style={styles.confirmButton}>
                                 <Text style={styles.confirmButtonText}>{t('common.add')}</Text>
                             </TouchableOpacity>
                         </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
        height: 50,
        borderBottomWidth: 1,
        borderColor: colors.border
    },
    backButton: {
        padding: 5
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    content: {
        flex: 1,
        padding: 16
    },
    section: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 5,
        opacity: 0.7
    },
    selectButton: {
        backgroundColor: colors.card,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center'
    },
    selectButtonText: {
        color: colors.primary,
        fontWeight: '600'
    },
    table: {
        marginBottom: 20
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: colors.border,
        marginBottom: 8
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.text
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: colors.border + '40'
    },
    tableText: {
        fontSize: 13,
        color: colors.text
    },
    tableTextMain: {
        fontSize: 13,
        color: colors.text,
        fontWeight: '500'
    },
    tableTextSub: {
        fontSize: 11,
        color: colors.text,
        opacity: 0.6
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderColor: colors.border
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary
    },
    commentContainer: {
        marginTop: 20,
        backgroundColor: colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border
    },
    commentInput: {
        padding: 12,
        color: colors.text,
        minHeight: 40
    },
    addProductButton: {
        marginTop: 20,
        backgroundColor: colors.card,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        alignItems: 'center'
    },
    addProductButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600'
    },
    modalContainer: {
        flex: 1,
        backgroundColor: colors.background
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: colors.border
    },
    modalTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text
    },
    listItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderColor: colors.border
    },
    listItemText: {
        fontSize: 16,
        color: colors.text
    },
    listItemSubText: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.7
    },
    searchInput: {
        flex: 1,
        backgroundColor: colors.card,
        padding: 8,
        borderRadius: 8,
        color: colors.text
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    quantityModal: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        elevation: 5
    },
    inputGroup: {
        marginBottom: 15
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: colors.text,
        marginTop: 5
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        gap: 10
    },
    cancelButton: {
        padding: 10
    },
    cancelButtonText: {
        color: colors.danger,
        fontSize: 16
    },
    confirmButton: {
        backgroundColor: colors.primary,
        padding: 10,
        borderRadius: 8
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    }
});
