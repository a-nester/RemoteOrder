import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PriceDocument, PriceDocumentItem, PriceDocumentsService } from '../../../services/priceDocuments.service';
import { PriceType } from '../../../types/priceType';
import { getAllPriceTypes } from '../../../db/productsDb';
import { useProductsStore } from '../../../store/products.store';
import ProductsScreen from '../../common/ProductsScreen';

interface Props {
    onBack: () => void;
    documentId?: string; // If undefined, creating new
}

export default function PriceDocumentEditorScreen({ onBack, documentId }: Props) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Header Data
    const [date, setDate] = useState(new Date());
    const [comment, setComment] = useState('');
    const [targetPriceTypeId, setTargetPriceTypeId] = useState<string | null>(null);
    const [inputMethod, setInputMethod] = useState<'MANUAL' | 'FORMULA'>('MANUAL');
    const [sourcePriceTypeId, setSourcePriceTypeId] = useState<string | null>(null);
    const [markupPercentage, setMarkupPercentage] = useState<string>('0');
    const [status, setStatus] = useState<'DRAFT' | 'APPLIED'>('DRAFT');

    // Items
    const [items, setItems] = useState<PriceDocumentItem[]>([]);
    
    // Refs
    const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
    const [showProductSelector, setShowProductSelector] = useState(false);
    
    // UI State
    const [targetTypeModalVisible, setTargetTypeModalVisible] = useState(false);
    const [sourceTypeModalVisible, setSourceTypeModalVisible] = useState(false);
    const [methodModalVisible, setMethodModalVisible] = useState(false);

    const [isEditing, setIsEditing] = useState(!documentId);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load Price Types
            const types = getAllPriceTypes();
            setPriceTypes(types);
            if (types.length > 0 && !targetPriceTypeId) {
                setTargetPriceTypeId(types[0].id);
            }

            // Load Document if editing
            if (documentId) {
                const doc = await PriceDocumentsService.getDocument(documentId);
                setDate(new Date(doc.date));
                setComment(doc.comment || '');
                setTargetPriceTypeId(doc.targetPriceTypeId);
                setInputMethod(doc.inputMethod);
                setSourcePriceTypeId(doc.sourcePriceTypeId || null);
                setMarkupPercentage(doc.markupPercentage?.toString() || '0');
                setStatus(doc.status);
                setItems(doc.items || []);
                setIsEditing(false); // Start in view mode for existing docs
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load document data');
        } finally {
            setLoading(false);
        }
    };

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(i => i.productId !== productId));
    };

    const handleSave = async (apply = false) => {
        if (!targetPriceTypeId) {
            Alert.alert('Validation', 'Please select a target price type');
            return;
        }
        if (inputMethod === 'FORMULA' && !sourcePriceTypeId) {
            Alert.alert('Validation', 'Please select a source price type for formula');
            return;
        }

        setSaving(true);
        try {
            const data: Partial<PriceDocument> = {
                date: date.toISOString(),
                comment,
                targetPriceTypeId,
                inputMethod,
                sourcePriceTypeId: inputMethod === 'FORMULA' ? sourcePriceTypeId! : undefined,
                markupPercentage: inputMethod === 'FORMULA' ? parseFloat(markupPercentage) : undefined,
            };

            let docId = documentId;
            if (docId) {
                await PriceDocumentsService.updateDocument(docId, data);
            } else {
                const newDoc = await PriceDocumentsService.createDocument(data);
                docId = newDoc.id;
            }

            // Save Items
            const itemsPayload = items.map(i => ({ productId: i.productId, price: i.price }));
            await PriceDocumentsService.updateDocumentItems(docId!, itemsPayload);

            if (apply) {
                await PriceDocumentsService.applyDocument(docId!);
                Alert.alert('Success', 'Prices applied successfully!', [{ text: 'OK', onPress: onBack }]);
            } else {
                // If saving without applying, verify if we want to stay in edit mode
                setIsEditing(false); // Switch back to view mode after save
                Alert.alert('Success', 'Document saved.', [
                   { text: 'Keep Editing', onPress: () => setIsEditing(true) },
                   { text: 'OK', onPress: () => { /* Stay in view mode */ } }
                ]);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };
    

    const handleAddProduct = (product: any) => {
        // Check if already exists
        if (items.find(i => i.productId === product.id)) return;

        // Determine initial price
        let initialPrice = 0;
        if (inputMethod === 'FORMULA' && sourcePriceTypeId) {
            // Find price of source type
            // This is tricky because `product` object from `ProductsScreen` might not have all prices 
            // if it comes from a lightweight list. But usually `prices` object is there.
            // Let's assume we have `product.prices`.
            // We need to map UUID to slug... locally?
            const sourceType = priceTypes.find(t => t.id === sourcePriceTypeId);
            if (sourceType && product.prices) {
                const sourcePrice = product.prices[sourceType.slug] || 0;
                const markup = parseFloat(markupPercentage) || 0;
                initialPrice = Number(sourcePrice) * (1 + markup / 100);
            }
        } else {
            // Manual: maybe prefill with current target price?
            const targetType = priceTypes.find(t => t.id === targetPriceTypeId);
            if (targetType && product.prices) {
                initialPrice = product.prices[targetType.slug] || 0;
            }
        }

        const newItem: PriceDocumentItem = {
            documentId: documentId || 'temp', // irrelevant for UI
            productId: product.id,
            productName: product.name,
            unit: product.unit,
            price: initialPrice
        };
        setItems(prev => [...prev, newItem]);
        setShowProductSelector(false);
    };

    const updateItemPrice = (productId: string, price: string) => {
        setItems(prev => prev.map(i => i.productId === productId ? { ...i, price: parseFloat(price) || 0 } : i));
    };

    const SelectionModal = ({ visible, onClose, title, options, onSelect }: any) => (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalParams}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    {options.map((opt: any) => (
                        <TouchableOpacity key={opt.id} style={styles.option} onPress={() => { onSelect(opt.id); onClose(); }}>
                            <Text style={styles.optionText}>{opt.name}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (showProductSelector) {
        return <ProductsScreen onBack={() => setShowProductSelector(false)} onSelectProduct={handleAddProduct} role="admin" />;
    }

    const currentTargetName = priceTypes.find(t => t.id === targetPriceTypeId)?.name || 'Select...';
    const currentSourceName = priceTypes.find(t => t.id === sourcePriceTypeId)?.name || 'Select...';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}><Text style={styles.backText}>Back</Text></TouchableOpacity>
                <Text style={styles.title}>{documentId ? (isEditing ? 'Editing Document' : 'View Document') : 'New Document'}</Text>
                
                {/* Header Action Button */}
                {!isEditing ? (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                         <Text style={styles.saveText}>Edit</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => handleSave(false)} disabled={saving || !isEditing}>
                        {isEditing && <Text style={[styles.saveText, (!isEditing) && styles.disabledText]}>Save</Text>}
                    </TouchableOpacity>
                )}
            </View>

            {/* Document Details (Context Menus) */}
            <View style={styles.form}>
                {/* ... fields ... */}
                <View style={styles.row}>
                    <Text style={styles.label}>Date:</Text>
                    <Text style={styles.value}>{date.toLocaleDateString()}</Text>
                </View>

                {/* Input Method */}
                <TouchableOpacity style={styles.row} onPress={() => setMethodModalVisible(true)} disabled={!isEditing}>
                    <Text style={styles.label}>Method:</Text>
                    <Text style={styles.value}>{inputMethod}</Text>
                </TouchableOpacity>

                {/* Target Price Type */}
                <TouchableOpacity style={styles.row} onPress={() => setTargetTypeModalVisible(true)} disabled={!isEditing}>
                    <Text style={styles.label}>Target Price:</Text>
                    <Text style={styles.value}>{currentTargetName}</Text>
                </TouchableOpacity>

                {/* Formula Config */}
                {inputMethod === 'FORMULA' && (
                    <>
                        <TouchableOpacity style={styles.row} onPress={() => setSourceTypeModalVisible(true)} disabled={!isEditing}>
                            <Text style={styles.label}>Base Price:</Text>
                            <Text style={styles.value}>{currentSourceName}</Text>
                        </TouchableOpacity>
                        <View style={styles.row}>
                            <Text style={styles.label}>Markup %:</Text>
                            <TextInput
                                style={styles.input}
                                value={markupPercentage}
                                onChangeText={setMarkupPercentage}
                                keyboardType="numeric"
                                editable={isEditing}
                            />
                        </View>
                    </>
                )}
                
                <TextInput 
                    style={styles.commentInput} 
                    placeholder="Comment..." 
                    value={comment} 
                    onChangeText={setComment} 
                    editable={isEditing}
                />
            </View>

            {/* Items List */}
            <View style={styles.listContainer}>
                <View style={styles.listHeader}>
                    <Text style={styles.colsName}>Product</Text>
                    <Text style={styles.colsPrice}>Price</Text>
                     <View style={{ width: 40 }} />
                </View>
                <FlatList
                    data={items}
                    keyExtractor={item => item.productId}
                    renderItem={({ item }) => (
                        <View style={styles.itemRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemName}>{item.productName || 'Product'}</Text>
                                <Text style={styles.itemUnit}>{item.unit}</Text>
                            </View>
                            <TextInput
                                style={styles.priceInput}
                                value={item.price.toString()}
                                onChangeText={(text) => updateItemPrice(item.productId, text)}
                                keyboardType="numeric"
                                editable={isEditing}
                            />
                            {isEditing && (
                                <TouchableOpacity 
                                    style={styles.deleteButton} 
                                    onPress={() => removeItem(item.productId)}
                                >
                                    <Text style={styles.deleteButtonText}>×</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                />
            </View>


            {/* Footer Actions */}
            <View style={styles.footer}>
                {isEditing && (
                    <>
                        <TouchableOpacity style={styles.addButton} onPress={() => setShowProductSelector(true)}>
                            <Text style={styles.addButtonText}>+ Add Item</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyButton} onPress={() => handleSave(true)}>
                            <Text style={styles.applyText}>Apply Prices</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Modals */}
            <SelectionModal 
                visible={methodModalVisible} 
                title="Select Input Method" 
                options={[{ id: 'MANUAL', name: 'Manual Entry' }, { id: 'FORMULA', name: 'Markup by Formula' }]}
                onClose={() => setMethodModalVisible(false)}
                onSelect={(id: any) => setInputMethod(id)}
            />
            <SelectionModal 
                visible={targetTypeModalVisible} 
                title="Select Target Price" 
                options={priceTypes}
                onClose={() => setTargetTypeModalVisible(false)}
                onSelect={setTargetPriceTypeId}
            />
            <SelectionModal 
                visible={sourceTypeModalVisible} 
                title="Select Base Price" 
                options={priceTypes}
                onClose={() => setSourceTypeModalVisible(false)}
                onSelect={setSourcePriceTypeId}
            />
            
            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" />
                </View>
            )}
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
    title: { fontSize: 18, fontWeight: '700' },
    saveText: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
    disabledText: { color: '#94A3B8' },
    
    form: { padding: 16, backgroundColor: '#fff', marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    label: { fontSize: 16, fontWeight: '500', color: '#334155' },
    value: { fontSize: 16, color: '#3B82F6', fontWeight: '500' },
    input: { 
        backgroundColor: '#F1F5F9', borderRadius: 4, padding: 8, width: 80, textAlign: 'right',
        borderWidth: 1, borderColor: '#CBD5E1' 
    },
    commentInput: {
        backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12, marginTop: 4,
        borderWidth: 1, borderColor: '#CBD5E1', minHeight: 60
    },

    listContainer: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
    listHeader: { 
        flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
        marginBottom: 8
    },
    colsName: { flex: 1, fontWeight: '600', color: '#64748B' },
    colsPrice: { width: 100, fontWeight: '600', color: '#64748B', textAlign: 'right' },
    
    itemRow: { 
        flexDirection: 'row', alignItems: 'center', paddingVertical: 12, 
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9' 
    },
    itemName: { fontSize: 16, color: '#1E293B', fontWeight: '500' },
    itemUnit: { fontSize: 12, color: '#64748B' },
    priceInput: {
        width: 100, textAlign: 'right', padding: 8, backgroundColor: '#F8FAFC',
        borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0'
    },

    footer: { padding: 16, flexDirection: 'row', gap: 12 },
    addButton: { 
        flex: 1, padding: 16, backgroundColor: '#E2E8F0', borderRadius: 8, 
        alignItems: 'center' 
    },
    addButtonText: { color: '#334155', fontWeight: '600', fontSize: 16 },
    applyButton: { 
        flex: 1, padding: 16, backgroundColor: '#22C55E', borderRadius: 8, 
        alignItems: 'center' 
    },
    applyText: { color: '#fff', fontWeight: '600', fontSize: 16 },

    // Modal
    modalParams: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    option: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    optionText: { fontSize: 16, textAlign: 'center', color: '#334155' },
    cancelButton: { marginTop: 16, padding: 16, backgroundColor: '#F1F5F9', borderRadius: 8 },
    cancelText: { textAlign: 'center', fontWeight: '600', color: '#64748B' },
    
    loader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)' },
    
    deleteButton: {
        marginLeft: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2',
        justifyContent: 'center', alignItems: 'center'
    },
    deleteButtonText: { color: '#EF4444', fontSize: 18, fontWeight: 'bold', marginTop: -2 }
});
