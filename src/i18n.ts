
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const en = {
    common: {
        loading: "Loading...",
        error: "Error",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        add: "Add",
        apply: "Apply",
        copy: "Copy",
        confirm: "Confirm",
        search: "Search...",
        actions: "Actions",
        failedToLoad: "Failed to load data",
        failedToSave: "Failed to save data"
    },
    menu: {
        dashboard: "Dashboard",
        products: "Products",
        priceEditor: "Price Editor",
        priceSettings: "Price Settings",
        priceTypes: "Price Types",
        counterparties: "Counterparties",
        orders: "Orders",
        archive: "Archive",
        settings: "Settings",
        signOut: "Sign Out"
    },
    settings: {
        title: "Settings",
        language: "Language",
        theme: "Theme",
        light: "Light",
        dark: "Dark",
        system: "System"
    },
    priceDocument: {
        titleNew: "New Price Document",
        titleEdit: "Edit Price Document",
        details: "Document Details",
        date: "Date",
        inputMethod: "Input Method",
        manual: "Manual Entry",
        formula: "Formula (Markup)",
        targetPriceType: "Target Price Type (To set)",
        sourcePriceType: "Source Price Type (Base for calc)",
        markup: "Markup Percentage (%)",
        rounding: "Rounding (0.01 - 10)",
        comment: "Comment",
        productsPrices: "Products & Prices",
        sourcePrice: "Source Price",
        targetPrice: "Target Price",
        applyPrices: "Apply Prices",
        applied: "APPLIED"
    },
    organization: {
        title: "Organization Settings",
        details: "Organization Details",
        name: "Name",
        warehouses: "Warehouses"
    },
    warehouse: {
        add: "Add Warehouse",
        edit: "Edit Warehouse"
    },
    counterparties: {
        title: "Counterparties",
        newGroup: "New Group",
        newCounterparty: "New Counterparty",
        editCounterparty: "Edit Counterparty",
        groupName: "Group Name",
        name: "Name",
        address: "Address",
        phone: "Phone",
        contactPerson: "Contact Person",
        buyer: "Buyer",
        seller: "Seller",
        group: "Group",
        priceType: "Price Type",
        selectPriceType: "Select Price Type",
        noGroup: "No Group"
    },
    action: {
        selectClient: "Select Client"
    },
    order: {
        create: "New Order",
        archiveConfirmation: "Are you sure you want to move this order to archive?",
        hardDeleteConfirmation: "Are you sure you want to permanently delete this order? This cannot be undone."
    },
    status: {
        NEW: "New",
        ACCEPTED: "Accepted",
        COMPLETED: "Completed"
    }
};

const uk = {
    common: {
        loading: "Завантаження...",
        error: "Помилка",
        save: "Зберегти",
        "cancel": "Скасувати",
        "delete": "Видалити",
        "edit": "Редагувати",
        "add": "Додати",
        "apply": "Застосувати",
        "copy": "Копіювати",
        "confirm": "Підтвердити",
        "search": "Пошук...",
        "actions": "Дії",
        "failedToLoad": "Не вдалося завантажити дані",
        "failedToSave": "Не вдалося зберегти дані",
        "addProduct": "Додати Товар",
        "deleted": "Видалено"
    },
    "menu": {
        "dashboard": "Дашборд",
        "products": "Товари",
        "priceEditor": "Редактор Цін",
        "priceSettings": "Установка цін",
        "priceTypes": "Типи цін",
        "organizationSettings": "Організація",
        "counterparties": "Контрагенти",
        "orders": "Замовлення",
        "archive": "Архів",
        "settings": "Налаштування",
        "signOut": "Вихід"
    },
    "settings": {
        "title": "Налаштування",
        "language": "Мова",
        "theme": "Тема",
        "light": "Світла",
        "dark": "Темна",
        "system": "Системна"
    },
    "priceDocument": {
        "titleNew": "Новий Ціновий Документ",
        "titleEdit": "Редагування Цінового Документа",
        "details": "Деталі Документа",
        "date": "Дата",
        "inputMethod": "Метод Введення",
        "manual": "Ручне Введення",
        "formula": "Формула (Націнка)",
        "targetPriceType": "Тип Ціни (Встановити)",
        "sourcePriceType": "Базова Ціна (Для розрахунку)",
        "markup": "Відсоток Націнки (%)",
        "rounding": "Округлення (0.01 - 10)",
        "comment": "Коментар",
        "productsPrices": "Товари та Ціни",
        "sourcePrice": "Вхідна Ціна",
        "targetPrice": "Вихідна Ціна",
        "applyPrices": "Застосувати Ціни",
        "applied": "ЗАСТОСОВАНО"
    },
    organization: {
        title: "Налаштування Організації",
        details: "Деталі Організації",
        name: "Назва",
        warehouses: "Склади"
    },
    warehouse: {
        add: "Додати Склад",
        edit: "Редагувати Склад"
    },
    "counterparties": {
        "title": "Контрагенти",
        "newGroup": "Нова Група",
        "newCounterparty": "Новий Контрагент",
        "editCounterparty": "Редагування Контрагента",
        "groupName": "Назва Групи",
        "name": "Назва",
        "address": "Адреса",
        "phone": "Телефон",
        "contactPerson": "Контактна Особа",
        "buyer": "Покупець",
        "seller": "Продавець",
        "group": "Група",
        "priceType": "Тип Ціни",
        "selectPriceType": "Оберіть Тип Ціни",
        "noGroup": "Без Групи"
    },
    "action": {
        "selectClient": "Обрати Клієнта"
    },
    "order": {
        "create": "Нове Замовлення",
        "archiveConfirmation": "Ви впевнені, що хочете перемістити це замовлення в архів?",
        "hardDeleteConfirmation": "Ви впевнені, що хочете назавжди видалити це замовлення? Цю дію неможливо скасувати."
    },
    "status": {
        "NEW": "Нове",
        "ACCEPTED": "Прийнято",
        "COMPLETED": "Проведено"
    }
};

const getLanguage = async () => {
    try {
        const choice = await AsyncStorage.getItem('user-language');
        if (choice) return choice;

        // Basic detection
        const deviceLanguage =
            Platform.OS === 'ios'
                ? NativeModules.SettingsManager.settings.AppleLocale ||
                NativeModules.SettingsManager.settings.AppleLanguages[0] // iOS 13
                : NativeModules.I18nManager.localeIdentifier;

        return deviceLanguage.includes('uk') ? 'uk' : 'en';
    } catch (error) {
        return 'en';
    }
};

// Initialize i18next
const initI18n = async () => {
    const lng = await getLanguage();

    i18n.use(initReactI18next).init({
        compatibilityJSON: 'v4',
        resources: {
            en: { translation: en },
            uk: { translation: uk },
        },
        lng: lng,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });
};

initI18n();

export default i18n;
