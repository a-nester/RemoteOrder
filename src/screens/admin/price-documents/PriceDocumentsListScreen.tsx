import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PriceDocumentsService, PriceDocument } from '../../../services/priceDocuments.service';

interface Props {
    onBack: () => void;
    onSelectDocument: (doc: PriceDocument) => void;
    onCreateDocument: () => void;
}

export default function PriceDocumentsListScreen({ onBack, onSelectDocument, onCreateDocument }: Props) {
    const [documents, setDocuments] = useState<PriceDocument[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const docs = await PriceDocumentsService.getDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: PriceDocument }) => (
        <TouchableOpacity style={styles.card} onPress={() => onSelectDocument(item)}>
            <View style={styles.row}>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
                <View style={[styles.statusBadge, item.status === 'APPLIED' ? styles.statusApplied : styles.statusDraft]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            <Text style={styles.type}>Target: {item.targetPriceTypeName || 'Unknown'}</Text>
            {item.comment && <Text style={styles.comment}>{item.comment}</Text>}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Price Documents</Text>
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
                    ListEmptyComponent={<Text style={styles.emptyText}>No documents found.</Text>}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={onCreateDocument}>
                <Text style={styles.fabText}>+</Text>
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
    backButtonText: { fontSize: 16, color: '#64748B' },
    title: { fontSize: 18, fontWeight: '700' },
    list: { padding: 16 },
    card: {
        backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12,
        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    date: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusDraft: { backgroundColor: '#E2E8F0' },
    statusApplied: { backgroundColor: '#DCFCE7' },
    statusText: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
    type: { fontSize: 14, color: '#475569', marginBottom: 4 },
    comment: { fontSize: 14, color: '#64748B', fontStyle: 'italic' },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' },
    fab: {
        position: 'absolute', bottom: 24, right: 24,
        width: 56, height: 56, borderRadius: 28, backgroundColor: '#3B82F6',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
    },
    fabText: { fontSize: 32, color: '#fff', marginTop: -4 }
});
