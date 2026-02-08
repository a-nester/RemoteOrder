import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: (price: number, reason: string) => Promise<void>;
    currentPrice: number;
    priceTypeName: string;
}

export const PriceChangeModal: React.FC<Props> = ({ visible, onClose, onSave, currentPrice, priceTypeName }) => {
    const [price, setPrice] = useState(currentPrice.toString());
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) {
            alert('Please enter a valid price');
            return;
        }

        try {
            setLoading(true);
            await onSave(numPrice, reason);
            setPrice('');
            setReason('');
            onClose();
        } catch (e) {
            alert('Failed to save price');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>Change Price: {priceTypeName}</Text>
                    
                    <Text style={styles.label}>New Price</Text>
                    <TextInput 
                        style={styles.input} 
                        value={price} 
                        onChangeText={setPrice} 
                        keyboardType="numeric" 
                        placeholder="0.00"
                    />

                    <Text style={styles.label}>Reason (Optional)</Text>
                    <TextInput 
                        style={styles.input} 
                        value={reason} 
                        onChangeText={setReason} 
                        placeholder="e.g. Supplier price increase"
                        multiline
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Product Price</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1E293B',
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    cancelText: {
        color: '#64748B',
        fontWeight: '600',
    },
    saveBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
    },
});
