
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';
import { CounterpartyService } from '../../../services/counterparty.service';
import { PriceTypesService } from '../../../services/priceTypes.service';
import { Counterparty, CounterpartyGroup } from '../../../types/counterparty';
import { PriceType } from '../../../types/priceType';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // You might need to install this or use a custom dropdown

export const CounterpartyEditScreen = ({ onBack, counterparty }: { onBack: () => void, counterparty?: Counterparty }) => {
    const { t } = useTranslation();
    const { colors, isDark } = useTheme();

    const [formData, setFormData] = useState<Partial<Counterparty>>({
        name: '',
        address: '',
        phone: '',
        contactPerson: '',
        isBuyer: false,
        isSeller: false,
        priceTypeId: '',
        groupId: ''
    });

    const [groups, setGroups] = useState<CounterpartyGroup[]>([]);
    const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (counterparty) {
            setFormData(counterparty);
        }
        loadDependencies();
    }, []);

    const loadDependencies = async () => {
        try {
            const [groupData, typeData] = await Promise.all([
                CounterpartyService.getGroups(),
                PriceTypesService.fetchPriceTypes()
            ]);
            setGroups(groupData);
            setPriceTypes(typeData);
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('common.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            Alert.alert(t('common.error'), t('counterparties.nameRequired'));
            return;
        }

        setSaving(true);
        try {
            if (counterparty) {
                await CounterpartyService.update(counterparty.id, formData);
            } else {
                await CounterpartyService.create(formData);
            }
            onBack();
        } catch (error) {
            Alert.alert(t('common.error'), t('common.failedToSave'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {counterparty ? t('counterparties.editCounterparty') : t('counterparties.newCounterparty')}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.saveText, { color: colors.primary }]}>{t('common.save')}</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('counterparties.name')}</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                        value={formData.name}
                        onChangeText={text => setFormData({ ...formData, name: text })}
                        placeholder={t('counterparties.name')}
                        placeholderTextColor={colors.text}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('counterparties.phone')}</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                        value={formData.phone}
                        onChangeText={text => setFormData({ ...formData, phone: text })}
                        placeholder={t('counterparties.phone')}
                        placeholderTextColor={colors.text}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('counterparties.address')}</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                        value={formData.address}
                        onChangeText={text => setFormData({ ...formData, address: text })}
                        placeholder={t('counterparties.address')}
                        placeholderTextColor={colors.text}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('counterparties.contactPerson')}</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                        value={formData.contactPerson}
                        onChangeText={text => setFormData({ ...formData, contactPerson: text })}
                        placeholder={t('counterparties.contactPerson')}
                        placeholderTextColor={colors.text}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('counterparties.group')}</Text>
                    <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                        <Picker
                            selectedValue={formData.groupId}
                            onValueChange={(itemValue) => setFormData({ ...formData, groupId: itemValue })}
                            style={{ color: colors.text }}
                            dropdownIconColor={colors.text}
                        >
                            <Picker.Item label={t('counterparties.noGroup')} value="" />
                            {groups.map(g => (
                                <Picker.Item key={g.id} label={g.name} value={g.id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('counterparties.priceType')}</Text>
                    <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                        <Picker
                            selectedValue={formData.priceTypeId}
                            onValueChange={(itemValue) => setFormData({ ...formData, priceTypeId: itemValue })}
                            style={{ color: colors.text }}
                            dropdownIconColor={colors.text}
                        >
                            <Picker.Item label={t('counterparties.selectPriceType')} value="" />
                            {priceTypes.map(pt => (
                                <Picker.Item key={pt.id} label={`${pt.name} (${pt.currency})`} value={pt.id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.switchGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('counterparties.buyer')}</Text>
                    <Switch
                        value={formData.isBuyer}
                        onValueChange={val => setFormData({ ...formData, isBuyer: val })}
                        trackColor={{ false: "#767577", true: colors.primary }}
                    />
                </View>

                <View style={styles.switchGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('counterparties.seller')}</Text>
                    <Switch
                        value={formData.isSeller}
                        onValueChange={val => setFormData({ ...formData, isSeller: val })}
                        trackColor={{ false: "#767577", true: colors.primary }}
                    />
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    backButton: { padding: 4 },
    saveText: { fontSize: 16, fontWeight: '600' },
    form: { padding: 16 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
    input: { padding: 12, borderRadius: 8, borderWidth: 1 },
    pickerContainer: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
    switchGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingVertical: 8 },
});
