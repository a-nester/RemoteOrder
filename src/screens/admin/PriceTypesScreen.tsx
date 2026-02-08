import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { PriceType } from "../../types/priceType";
import { getAllPriceTypes, upsertPriceType, deletePriceType as deleteLocalPriceType } from "../../db/productsDb"; // Direct DB access for speed, sync later?
import { PriceTypesService } from "../../services/priceTypes.service";
import { useProductsStore } from "../../store/products.store";

interface Props {
    onBack: () => void;
}

export default function PriceTypesScreen({ onBack }: Props) {
    const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingType, setEditingType] = useState<PriceType | null>(null);

    // Form
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");

    const sync = useProductsStore(s => s.sync);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const data = getAllPriceTypes();
        setPriceTypes(data);
    };

    const handleOpenModal = (type?: PriceType) => {
        if (type) {
            setEditingType(type);
            setName(type.name);
            setSlug(type.slug);
        } else {
            setEditingType(null);
            setName("");
            setSlug("");
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!name || !slug) {
            Alert.alert("Error", "Name and Slug are required.");
            return;
        }

        try {
            setLoading(true);
            if (editingType) {
                await PriceTypesService.updatePriceType(editingType.id, name, slug);
            } else {
                await PriceTypesService.createPriceType(name, slug);
            }
            await sync(); // Sync to update local DB
            loadData();
            setModalVisible(false);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert("Delete Price Type", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await PriceTypesService.deletePriceType(id);
                        await sync();
                        loadData();
                    } catch (error: any) {
                        Alert.alert("Error", error.message);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: PriceType }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleOpenModal(item)}>
            <View>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.slug}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Price Types</Text>
                <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={priceTypes}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingType ? "Edit Price Type" : "New Price Type"}</Text>
                        
                        <Text style={styles.label}>Name</Text>
                        <TextInput 
                            style={styles.input} 
                            value={name} 
                            onChangeText={(text) => {
                                setName(text);
                                if (!editingType && !slug) {
                                    // Auto-slugify on create
                                    setSlug(text.toLowerCase().replace(/\s+/g, "_"));
                                }
                            }}
                            placeholder="e.g. Wholesale"
                        />

                        <Text style={styles.label}>Slug (Unique key)</Text>
                        <TextInput 
                            style={styles.input} 
                            value={slug} 
                            onChangeText={setSlug}
                            placeholder="e.g. wholesale"
                            autoCapitalize="none"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={styles.saveButtonModal} disabled={loading}>
                                <Text style={styles.saveButtonText}>{loading ? "Saving..." : "Save"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F7FA", marginTop: 16 },
    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
    },
    backButton: { padding: 8 },
    backButtonText: { fontSize: 16, color: "#64748B" },
    title: { fontSize: 18, fontWeight: "700" },
    addButton: { padding: 8 },
    addButtonText: { fontSize: 24, paddingHorizontal: 8, color: "#3B82F6" },
    list: { padding: 16 },
    card: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        backgroundColor: "#fff", padding: 16, borderRadius: 8, marginBottom: 12,
        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }
    },
    cardTitle: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
    cardSubtitle: { fontSize: 14, color: "#64748B", marginTop: 2 },
    deleteBtn: { padding: 8 },
    deleteText: { color: "#EF4444", fontWeight: "500" },
    
    // Modal
    modalContainer: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 20 },
    modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, textAlign: "center" },
    label: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 6 },
    input: {
        backgroundColor: "#F1F5F9", borderRadius: 8, padding: 12, marginBottom: 16,
        borderWidth: 1, borderColor: "#CBD5E1", fontSize: 16
    },
    modalActions: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 10 },
    cancelButton: { flex: 1, padding: 12, alignItems: "center", borderRadius: 8, backgroundColor: "#E2E8F0" },
    cancelButtonText: { color: "#475569", fontWeight: "600" },
    saveButtonModal: { flex: 1, padding: 12, alignItems: "center", borderRadius: 8, backgroundColor: "#3B82F6" },
    saveButtonText: { color: "#fff", fontWeight: "600" }
});
