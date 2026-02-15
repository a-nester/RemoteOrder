
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { OrdersService, OrderFilter } from "../../services/orders.service";
import { Order, OrderStatus } from "../../models/Order";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface OrdersScreenProps {
    onBack: () => void;
}

export default function OrdersScreen({ onBack }: OrdersScreenProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = getStyles(colors);

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Default date range: current month
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1); 
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    });

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const filter: OrderFilter = {
                startDate,
                endDate,
                search: searchTerm
            };
            const data = await OrdersService.getOrders(filter);
            setOrders(data);
        } catch (error) {
            console.error("Failed to load orders", error);
            Alert.alert(t('common.error'), t('common.failedToLoad'));
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, searchTerm, t]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const handleCreateOrder = () => {
        Alert.alert(t('order.create'), "Functionality to create order to be implemented");
    };

    const handleEditOrder = (order: Order) => {
        Alert.alert(t('common.edit'), `Edit order ${order.id} functionality to be implemented`);
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case "NEW": return colors.primary; // Blue-ish usually
            case "ACCEPTED": return "#F59E0B"; // Amazon Orange/Yellow
            case "COMPLETED": return "#10B981"; // Emerald Green
            default: return colors.text;
        }
    };
    
    // Simple Badge Component
    const StatusBadge = ({ status }: { status: OrderStatus }) => (
        <View style={[styles.badge, { backgroundColor: getStatusColor(status) + '20' }]}>
            <Text style={[styles.badgeText, { color: getStatusColor(status) }]}>
                {t(`status.${status}`, status)}
            </Text>
        </View>
    );

    const renderItem = ({ item }: { item: Order }) => (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                <StatusBadge status={item.status} />
            </View>
            
            <View style={styles.cardRow}>
                <Text style={styles.counterpartyText}>{item.counterpartyName}</Text>
            </View>

            <View style={styles.cardRow}>
                 <Text style={styles.amountText}>{item.amount.toFixed(2)} {item.currency}</Text>
                 <TouchableOpacity onPress={() => handleEditOrder(item)} style={styles.editButton}>
                    <Ionicons name="pencil" size={20} color={colors.primary} />
                 </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('menu.orders')}</Text>
                <TouchableOpacity onPress={handleCreateOrder} style={styles.createButton}>
                     <Ionicons name="add" size={24} color={colors.background} />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {/* Simple Text Inputs for Date for now (YYYY-MM-DD) */}
                <View style={styles.dateRow}>
                     <TextInput 
                        style={styles.dateInput}
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.text + '50'}
                     />
                     <Text style={styles.dateSeparator}>-</Text>
                     <TextInput 
                        style={styles.dateInput}
                        value={endDate}
                        onChangeText={setEndDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.text + '50'}
                     />
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.text + '80'} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholder={t('common.search')}
                        placeholderTextColor={colors.text + '80'}
                    />
                </View>
            </View>

            {/* List */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>{t('common.noData', 'No orders found')}</Text>
                    }
                />
            )}
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
        height: 50
    },
    backButton: {
        padding: 5
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text
    },
    createButton: {
        backgroundColor: colors.primary,
        borderRadius: 20,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center'
    },
    filtersContainer: {
        padding: 16,
        gap: 12
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    dateInput: {
        flex: 1,
        backgroundColor: colors.card,
        color: colors.text,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        textAlign: 'center'
    },
    dateSeparator: {
        paddingHorizontal: 10,
        color: colors.text
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: colors.border
    },
    searchInput: {
        flex: 1,
        color: colors.text
    },
    listContent: {
        padding: 16
    },
    card: {
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    dateText: {
        color: colors.text,
        opacity: 0.7,
        fontSize: 14
    },
    counterpartyText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600'
    },
    amountText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold'
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    editButton: {
         padding: 5
    },
    emptyText: {
        textAlign: 'center',
        color: colors.text,
        marginTop: 20,
        opacity: 0.6
    }
});
