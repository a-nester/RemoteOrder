import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { PriceHistoryEntry } from '../../../types/priceHistory';

interface Props {
    history: PriceHistoryEntry[];
}

export const PriceHistoryList: React.FC<Props> = ({ history }) => {
    if (!history || history.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No price history available.</Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: PriceHistoryEntry }) => {
        const date = new Date(item.effectiveDate).toLocaleDateString() + ' ' + new Date(item.effectiveDate).toLocaleTimeString();
        const priceType = item.priceTypeId ? `(${item.priceTypeId})` : '(Standard)'; // In real app map ID to name
        
        return (
            <View style={styles.itemContainer}>
                <View style={styles.header}>
                    <Text style={styles.date}>{date}</Text>
                    <Text style={styles.priceChange}>
                         {item.oldPrice} ➔ <Text style={styles.newPrice}>{item.newPrice}</Text>
                    </Text>
                </View>
                {item.reason && <Text style={styles.reason}>📝 {item.reason}</Text>}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Price History</Text>
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                scrollEnabled={false} // Nested in ScrollView usually
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1E293B',
    },
    emptyContainer: {
        padding: 16,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94A3B8',
    },
    itemContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    date: {
        fontSize: 12,
        color: '#64748B',
    },
    priceChange: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    newPrice: {
        color: '#10B981',
        fontWeight: 'bold',
    },
    reason: {
        fontSize: 13,
        color: '#475569',
        marginTop: 2,
        fontStyle: 'italic',
    },
});
