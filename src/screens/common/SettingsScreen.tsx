
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const SettingsScreen = () => {
    const { t, i18n } = useTranslation();
    const { theme, setTheme, colors, isDark } = useTheme();

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.language')}</Text>
                <View style={styles.row}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            i18n.language === 'en' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => changeLanguage('en')}
                    >
                        <Text style={[styles.buttonText, i18n.language === 'en' ? { color: 'white' } : { color: colors.text }]}>English</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            i18n.language === 'uk' && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => changeLanguage('uk')}
                    >
                        <Text style={[styles.buttonText, i18n.language === 'uk' ? { color: 'white' } : { color: colors.text }]}>Українська</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.theme')}</Text>
                
                <TouchableOpacity style={styles.option} onPress={() => setTheme('light')}>
                    <Ionicons name="sunny" size={24} color={theme === 'light' ? colors.primary : colors.text} />
                    <Text style={[styles.optionText, { color: colors.text }]}>{t('settings.light')}</Text>
                    {theme === 'light' && <Ionicons name="checkmark" size={24} color={colors.primary} />}
                </TouchableOpacity>

                <View style={[styles.separator, { backgroundColor: colors.border }]} />

                <TouchableOpacity style={styles.option} onPress={() => setTheme('dark')}>
                    <Ionicons name="moon" size={24} color={theme === 'dark' ? colors.primary : colors.text} />
                    <Text style={[styles.optionText, { color: colors.text }]}>{t('settings.dark')}</Text>
                    {theme === 'dark' && <Ionicons name="checkmark" size={24} color={colors.primary} />}
                </TouchableOpacity>

                <View style={[styles.separator, { backgroundColor: colors.border }]} />

                <TouchableOpacity style={styles.option} onPress={() => setTheme('system')}>
                    <Ionicons name="hardware-chip-outline" size={24} color={theme === 'system' ? colors.primary : colors.text} />
                    <Text style={[styles.optionText, { color: colors.text }]}>{t('settings.system')}</Text>
                    {theme === 'system' && <Ionicons name="checkmark" size={24} color={colors.primary} />}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        flex: 1,
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: '500',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    optionText: {
        marginLeft: 12,
        fontSize: 16,
        flex: 1,
    },
    separator: {
        height: 1,
        marginVertical: 4,
    }
});
