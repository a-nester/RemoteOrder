
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
    colors: {
        background: string;
        text: string;
        card: string;
        border: string;
        primary: string;
        danger: string;
    };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState<Theme>('system');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('user-theme');
            if (savedTheme) setTheme(savedTheme as Theme);
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    };

    const handleSetTheme = async (newTheme: Theme) => {
        setTheme(newTheme);
        try {
            await AsyncStorage.setItem('user-theme', newTheme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const isDark = theme === 'system' ? systemScheme === 'dark' : theme === 'dark';

    const colors = {
        background: isDark ? '#111827' : '#F3F4F6', // gray-900 : gray-100
        text: isDark ? '#F9FAFB' : '#111827', // gray-50 : gray-900
        card: isDark ? '#1F2937' : '#FFFFFF', // gray-800 : white
        border: isDark ? '#374151' : '#E5E7EB', // gray-700 : gray-200
        primary: '#4F46E5', // indigo-600
        danger: '#EF4444', // red-500
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDark, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
