import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoodsReceiptService } from '../../services/goodsReceipt.service';
import { GoodsReceipt } from '../../types/goodsReceipt';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    onBack: () => void;
    onSelectDocument: (doc: GoodsReceipt) => void;
    onCreateDocument: () => void;
}

export default function GoodsReceiptListScreen({ onBack, onSelectDocument, onCreateDocument }: Props) {
    const [documents, setDocuments] = useState<GoodsReceipt[]>([]);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const docs = await GoodsReceiptService.getAll();
            setDocuments(docs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: GoodsReceipt }) => (
        <TouchableOpacity style={styles.card} onPress={() => onSelectDocument(item)}>
            <View style={styles.row}>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                <View style={[styles.statusBadge, item.status === 'POSTED' ? styles.statusPosted : styles.statusSaved]}>
                    <Text style={styles.statusText}>{item.status === 'POSTED' ? 'Проведено' : 'Збережено'}</Text>
                </View>
            </View>
            <View style={styles.row}>
                <Text style={styles.number}>№ {item.number}</Text>
            </View>
            <View style={styles.details}>
                <Text style={styles.provider}>{item.providerName || '---'}</Text>
                <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
                <Text style={styles.warehouse}>{item.warehouseName || '---'}</Text>
            </View>
            {item.comment && <Text style={styles.comment}>{item.comment}</Text>}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.title}>Поступлення товарів</Text>
                <View style={{ width: 40 }} /> 
            </View>

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={documents}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Документів не знайдено</Text>}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={onCreateDocument}>
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    },
    backButton: { padding: 8 },
    title: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    list: { padding: 16 },
    card: {
        backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12,
        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
        elevation: 2
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    date: { fontSize: 14, color: '#64748B' },
    number: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusSaved: { backgroundColor: '#FFF7ED' },
    statusPosted: { backgroundColor: '#DCFCE7' },
    statusText: { fontSize: 12, fontWeight: '600', color: '#1E293B' },

    details: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 4 },
    provider: { fontSize: 15, fontWeight: '500', color: '#334155', flex: 1 },
    warehouse: { fontSize: 14, color: '#475569', flex: 1, textAlign: 'right' },

    comment: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginTop: 4 },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' },
    fab: {
        position: 'absolute', bottom: 24, right: 24,
        width: 56, height: 56, borderRadius: 28, backgroundColor: '#3B82F6',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
        elevation: 5
    }
});
