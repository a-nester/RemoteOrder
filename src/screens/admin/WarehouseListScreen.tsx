import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useWarehouseStore } from "../../store/warehouse.store";

interface Props {
  onBack: () => void;
}

export default function WarehouseListScreen({ onBack }: Props) {
  const warehouses = useWarehouseStore((s) => s.warehouses);
  const syncWarehouses = useWarehouseStore((s) => s.syncWarehouses);
  const loading = useWarehouseStore((s) => s.loading);

  useEffect(() => {
    useWarehouseStore.getState().loadWarehouses();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Склади</Text>
        <TouchableOpacity onPress={() => syncWarehouses()} disabled={loading} style={styles.syncButton}>
            <Text style={styles.syncIcon}>{loading ? "..." : "🔄"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={warehouses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
                <Text style={styles.itemText}>{item.name}</Text>
                {item.address && <Text style={styles.itemSubText}>{item.address}</Text>}
            </View>
          </View>
        )}
        style={styles.list}
        ListEmptyComponent={
            <Text style={styles.emptyText}>Немає складів. Натисніть 🔄 щоб оновити.</Text>
        }
      />

      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Назад</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  syncButton: {
    padding: 10,
  },
  syncIcon: {
      fontSize: 24,
  },
  list: {
    flex: 1,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: {
    fontSize: 18,
    fontWeight: '500',
  },
  itemSubText: {
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
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 16,
  },
});
