import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useWarehouseStore } from "../../store/warehouse.store";

interface Props {
  onBack: () => void;
}

export default function WarehouseListScreen({ onBack }: Props) {
  const warehouses = useWarehouseStore((s) => s.warehouses);
  const addWarehouse = useWarehouseStore((s) => s.addWarehouse);
  const removeWarehouse = useWarehouseStore((s) => s.removeWarehouse);

  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (newName.trim()) {
      addWarehouse(newName.trim());
      setNewName("");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Управління складами</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Назва нового складу"
          value={newName}
          onChangeText={setNewName}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={warehouses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
            <TouchableOpacity onPress={() => removeWarehouse(item.id)}>
              <Text style={styles.deleteText}>Видалити</Text>
            </TouchableOpacity>
          </View>
        )}
        style={styles.list}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: {
    fontSize: 16,
  },
  deleteText: {
    color: "red",
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
