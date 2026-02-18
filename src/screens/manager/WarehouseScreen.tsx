import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useWarehouseStore } from "../../store/warehouse.store";

interface Props {
  onBack: () => void;
}

export default function WarehouseScreen({ onBack }: Props) {
  const warehouses = useWarehouseStore((s) => s.warehouses);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Виберіть склад</Text>
      
      <FlatList 
        data={warehouses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
            <TouchableOpacity style={styles.warehouseItem}>
                <Text style={styles.warehouseName}>{item.name}</Text>
                {item.address && <Text style={styles.warehouseAddress}>{item.address}</Text>}
            </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Складів не знайдено</Text>}
      />

      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Назад</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  warehouseItem: {
      padding: 20,
      backgroundColor: '#f8f9fa',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      marginBottom: 10,
      borderRadius: 8,
  },
  warehouseName: {
      fontSize: 18,
      fontWeight: '600',
  },
  warehouseAddress: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 20,
      color: '#888',
      fontSize: 16,
  },
  backButton: {
    padding: 15,
    backgroundColor: "#eee",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 16,
  },
});
