import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { PriceHistoryEntry } from '../../../types/priceHistory';
import { PriceType } from '../../../types/priceType';

interface Props {
    history: PriceHistoryEntry[];
    priceTypes?: PriceType[];
}

export const PriceHistoryList: React.FC<Props> = ({ history, priceTypes }) => {
    // ...
    const renderItem = ({ item }: { item: PriceHistoryEntry }) => {
        const date = new Date(item.effectiveDate).toLocaleDateString() + ' ' + new Date(item.effectiveDate).toLocaleTimeString();
        
        let typeName = 'Standard';
        if (item.priceTypeId) {
            const found = priceTypes?.find(pt => pt.id === item.priceTypeId);
            typeName = found ? found.name : 'Custom';
        }
        
        const priceLabel = `(${typeName})`;
        
        return (
            <View style={styles.itemContainer}>
                <View style={styles.header}>
                    <Text style={styles.date}>{date} <Text style={{fontWeight: 'bold'}}>{priceLabel}</Text></Text>
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
