import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoodsReceiptService } from '../../services/goodsReceipt.service';
import { OrganizationService } from '../../services/organization.service';
import { CounterpartyService } from '../../services/counterparty.service';
import { GoodsReceipt, GoodsReceiptItem } from '../../types/goodsReceipt';
import { Warehouse } from '../../types/warehouse';
import { Counterparty } from '../../types/counterparty';
import ProductsScreen from '../common/ProductsScreen';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    onBack: () => void;
    receiptId?: string;
}

export default function GoodsReceiptEditScreen({ onBack, receiptId }: Props) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showProductSelector, setShowProductSelector] = useState(false);

    // Data Sources
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [providers, setProviders] = useState<Counterparty[]>([]);

    // Form State
    const [doc, setDoc] = useState<Partial<GoodsReceipt>>({
        date: new Date().toISOString(),
        status: 'SAVED',
        items: []
    });

    // Modals
    const [warehouseModal, setWarehouseModal] = useState(false);
    const [providerModal, setProviderModal] = useState(false);

    const isEditing = !doc.status || doc.status === 'SAVED';
    const isNew = !receiptId;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [whs, cnts] = await Promise.all([
                OrganizationService.getWarehouses(),
                CounterpartyService.getAll()
            ]);
            setWarehouses(whs);
            setProviders(cnts);

            if (receiptId) {
                const existing = await GoodsReceiptService.getById(receiptId);
                setDoc(existing);
            } else {
                setDoc(prev => ({ ...prev, number: `GR-${Date.now().toString().slice(-6)}` }));
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (post = false) => {
        if (!doc.warehouseId || !doc.providerId) {
            Alert.alert("Validation", "Please select Warehouse and Provider");
            return;
        }

        setSaving(true);
        try {
            let savedDoc;
            if (isNew && !doc.id) { // !doc.id check because if we saved once, we have ID
                savedDoc = await GoodsReceiptService.create(doc);
            } else {
                savedDoc = await GoodsReceiptService.update(doc.id || receiptId!, doc);
            }

            if (post) {
                savedDoc = await GoodsReceiptService.post(savedDoc.id);
                Alert.alert("Success", "Document Posted!", [{ text: "OK", onPress: onBack }]);
            } else {
                setDoc(savedDoc); // Update local state with saved data (ID, etc)
                Alert.alert("Success", "Document Saved");
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.error || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleAddProduct = (product: any) => {
        // Prevent dupes? or allow? usually allow multiple lines for different prices/expiration?
        // Let's prevent simple dupes for now or just append.
        
        const newItem: GoodsReceiptItem = {
            id: Math.random().toString(), // Temp ID
            goodsReceiptId: doc.id || 'temp',
            productId: product.id,
            productName: product.name,
            quantity: 1,
            price: 0,
            total: 0
        };

        setDoc(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
        setShowProductSelector(false);
    };

    const updateItem = (index: number, field: keyof GoodsReceiptItem, value: any) => {
        const newItems = [...(doc.items || [])];
        const item = { ...newItems[index], [field]: value };
        
        if (field === 'quantity' || field === 'price') {
            item.total = Number(item.quantity || 0) * Number(item.price || 0);
        }

        newItems[index] = item;
        setDoc(prev => ({ ...prev, items: newItems }));
    };

    const removeItem = (index: number) => {
        const newItems = [...(doc.items || [])];
        newItems.splice(index, 1);
        setDoc(prev => ({ ...prev, items: newItems }));
    };

    const SelectionModal = ({ visible, onClose, title, options, onSelect }: any) => (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <FlatList 
                        data={options}
                        keyExtractor={(item: any) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.option} onPress={() => { onSelect(item.id); onClose(); }}>
                                <Text style={styles.optionText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (showProductSelector) return <ProductsScreen onBack={() => setShowProductSelector(false)} onSelectProduct={handleAddProduct} role="admin" />;

    const currentWarehouse = warehouses.find(w => w.id === doc.warehouseId)?.name || 'Select Warehouse';
    const currentProvider = providers.find(p => p.id === doc.providerId)?.name || 'Select Provider';
    const totalAmount = doc.items?.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || 0;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}><Text style={styles.backText}>Back</Text></TouchableOpacity>
                <Text style={styles.title}>{isNew ? 'New Receipt' : `Receipt ${doc.number}`}</Text>
                
                <View style={[styles.statusBadge, doc.status === 'POSTED' ? styles.statusPosted : styles.statusSaved]}>
                    <Text style={styles.statusText}>{doc.status === 'POSTED' ? 'Posted' : 'Saved'}</Text>
                </View>
            </View>

            <ScrollView style={styles.content}>
                {/* Header Form */}
                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Number</Text>
                        <TextInput 
                            style={styles.input} 
                            value={doc.number || ''} 
                            onChangeText={t => setDoc(prev => ({ ...prev, number: t }))}
                            editable={isEditing}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date</Text>
                        {/* Simplified Date Display/Edit */}
                        <Text style={styles.value}>{new Date(doc.date || Date.now()).toLocaleDateString()}</Text>
                    </View>
                    
                    <TouchableOpacity style={styles.inputGroup} onPress={() => setProviderModal(true)} disabled={!isEditing}>
                        <Text style={styles.label}>Provider</Text>
                        <Text style={[styles.value, !doc.providerId && styles.placeholder]}>{currentProvider}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.inputGroup} onPress={() => setWarehouseModal(true)} disabled={!isEditing}>
                        <Text style={styles.label}>Warehouse</Text>
                        <Text style={[styles.value, !doc.warehouseId && styles.placeholder]}>{currentWarehouse}</Text>
                    </TouchableOpacity>

                    <TextInput 
                        style={styles.commentInput} 
                        placeholder="Comment..." 
                        value={doc.comment || ''} 
                        onChangeText={t => setDoc(prev => ({ ...prev, comment: t }))}
                        editable={isEditing}
                        multiline
                    />
                </View>

                {/* Items List */}
                <View style={styles.itemsContainer}>
                    <View style={styles.itemsHeader}>
                        <Text style={styles.itemsTitle}>Items</Text>
                        {isEditing && (
                            <TouchableOpacity onPress={() => setShowProductSelector(true)}>
                                <Text style={styles.addItemText}>+ Add Item</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {doc.items?.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <View style={styles.itemMain}>
                                <Text style={styles.itemName}>{item.productName || 'Product'}</Text>
                                <View style={styles.itemInputs}>
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.inputLabel}>Qty</Text>
                                        <TextInput 
                                            style={styles.smallInput} 
                                            value={item.quantity?.toString()} 
                                            keyboardType="numeric"
                                            onChangeText={t => updateItem(index, 'quantity', t)}
                                            editable={isEditing}
                                        />
                                    </View>
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.inputLabel}>Price</Text>
                                        <TextInput 
                                            style={styles.smallInput} 
                                            value={item.price?.toString()} 
                                            keyboardType="numeric"
                                            onChangeText={t => updateItem(index, 'price', t)}
                                            editable={isEditing}
                                        />
                                    </View>
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.inputLabel}>Total</Text>
                                        <Text style={styles.itemTotal}>{Number(item.total).toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>
                            {isEditing && (
                                <TouchableOpacity onPress={() => removeItem(index)} style={styles.deleteButton}>
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount:</Text>
                        <Text style={styles.totalValue}>{totalAmount.toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer Actions */}
            {isEditing && (
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.button, styles.saveButton]} 
                        onPress={() => handleSave(false)}
                        disabled={saving}
                    >
                        <Text style={[styles.buttonText, { color: '#3B82F6' }]}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.button, styles.postButton]} 
                        onPress={() => handleSave(true)}
                        disabled={saving}
                    >
                        <Text style={[styles.buttonText, { color: '#fff' }]}>Post</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" />
                </View>
            )}

            <SelectionModal 
                visible={warehouseModal} 
                onClose={() => setWarehouseModal(false)}
                title="Select Warehouse"
                options={warehouses}
                onSelect={(id: string) => setDoc(prev => ({ ...prev, warehouseId: id }))}
            />
            <SelectionModal 
                visible={providerModal} 
                onClose={() => setProviderModal(false)}
                title="Select Provider"
                options={providers}
                onSelect={(id: string) => setDoc(prev => ({ ...prev, providerId: id }))}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    },
    backText: { fontSize: 16, color: '#64748B' },
    title: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusSaved: { backgroundColor: '#FFF7ED' },
    statusPosted: { backgroundColor: '#DCFCE7' },
    statusText: { fontSize: 12, fontWeight: '600', color: '#1E293B' },

    content: { flex: 1, padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    label: { fontSize: 16, color: '#64748B', fontWeight: '500' },
    value: { fontSize: 16, color: '#1E293B', fontWeight: '500' },
    placeholder: { color: '#CBD5E1' },
    input: { fontSize: 16, color: '#1E293B', fontWeight: '500', textAlign: 'right', flex: 1 },
    commentInput: { marginTop: 12, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, minHeight: 60, textAlignVertical: 'top' },

    itemsContainer: { marginBottom: 40 },
    itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    itemsTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    addItemText: { color: '#3B82F6', fontWeight: '600', fontSize: 16 },

    itemRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center' },
    itemMain: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
    itemInputs: { flexDirection: 'row', gap: 12 },
    inputWrapper: { flex: 1 },
    inputLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
    smallInput: { backgroundColor: '#F8FAFC', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#E2E8F0', textAlign: 'center' },
    itemTotal: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginTop: 8 },
    deleteButton: { padding: 8 },

    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 },
    totalLabel: { fontSize: 16, fontWeight: '600', color: '#64748B', marginRight: 12 },
    totalValue: { fontSize: 20, fontWeight: '700', color: '#1E293B' },

    footer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', gap: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    button: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    saveButton: { backgroundColor: '#EFF6FF' },
    postButton: { backgroundColor: '#22C55E' },
    buttonText: { fontSize: 16, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    option: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    optionText: { fontSize: 16, color: '#334155', textAlign: 'center' },
    cancelButton: { marginTop: 16, padding: 16, backgroundColor: '#F1F5F9', borderRadius: 8 },
    cancelText: { textAlign: 'center', fontWeight: '600', color: '#64748B' },

    loader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)' },
});
