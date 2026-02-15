
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { CounterpartyService } from '../../../services/counterparty.service';
import { Counterparty, CounterpartyGroup } from '../../../types/counterparty';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CounterpartiesListScreen = ({ onBack, onEdit, onCreate }: { onBack: () => void, onEdit: (cp: Counterparty) => void, onCreate: () => void }) => {
    const { t } = useTranslation();
    const { colors, isDark } = useTheme();
    const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
    const [groups, setGroups] = useState<CounterpartyGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGroupModalVisible, setGroupModalVisible] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [cpData, groupData] = await Promise.all([
                CounterpartyService.getAll(),
                CounterpartyService.getGroups()
            ]);
            setCounterparties(cpData);
            setGroups(groupData);
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('common.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        try {
            await CounterpartyService.createGroup(newGroupName);
            setNewGroupName('');
            setGroupModalVisible(false);
            loadData();
        } catch (error) {
            Alert.alert(t('common.error'), t('common.failedToSave'));
        }
    };



    const renderItem = ({ item }: { item: Counterparty }) => (
        <View style={[styles.itemContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.itemHeader}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <TouchableOpacity onPress={() => onEdit(item)}>
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>
            {item.groupName && <Text style={[styles.itemDetail, { color: colors.text, opacity: 0.7 }]}>{item.groupName}</Text>}
            <View style={styles.rolesContainer}>
                {item.isBuyer && <View style={[styles.roleBadge, { backgroundColor: isDark ? '#1a4731' : '#dcfce7' }]}><Text style={[styles.roleText, { color: isDark ? '#4ade80' : '#166534' }]}>{t('counterparties.buyer')}</Text></View>}
                {item.isSeller && <View style={[styles.roleBadge, { backgroundColor: isDark ? '#1e3a8a' : '#dbeafe' }]}><Text style={[styles.roleText, { color: isDark ? '#60a5fa' : '#1e40af' }]}>{t('counterparties.seller')}</Text></View>}
            </View>
        </View>
    );

    if (loading) {
        return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('menu.counterparties')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setGroupModalVisible(true)}>
                    <Ionicons name="folder-open-outline" size={20} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.text }]}>{t('counterparties.newGroup')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={onCreate}>
                    <Ionicons name="person-add-outline" size={20} color="#fff" />
                    <Text style={[styles.actionButtonText, { color: '#fff' }]}>{t('counterparties.newCounterparty')}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={counterparties}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
            />

            <Modal visible={isGroupModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('counterparties.newGroup')}</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                            placeholder={t('counterparties.groupName')}
                            placeholderTextColor={colors.text}
                            value={newGroupName}
                            onChangeText={setNewGroupName}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setGroupModalVisible(false)} style={styles.modalButton}>
                                <Text style={{ color: colors.text, opacity: 0.7 }}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreateGroup} style={[styles.modalButton, { backgroundColor: colors.primary }]}>
                                <Text style={{ color: '#fff' }}>{t('common.save')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    backButton: { padding: 4 },
    actionsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, borderWidth: 1, gap: 8 },
    actionButtonText: { fontWeight: '600' },
    listContent: { padding: 16 },
    itemContainer: { padding: 16, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    itemName: { fontSize: 16, fontWeight: 'bold' },
    itemDetail: { fontSize: 14, marginBottom: 8 },
    rolesContainer: { flexDirection: 'row', gap: 8 },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    roleText: { fontSize: 12, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
    modalContent: { padding: 20, borderRadius: 12 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    input: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
