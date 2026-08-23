import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TerritoryService } from "../../services/territory.service";
import type { Territory } from "../../types/territory";
import { useTheme } from "../../context/ThemeContext";

export default function TerritoriesScreen() {
  const { isDark } = useTheme();
  const isDarkMode = isDark;
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [name, setName] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const loadTerritories = async () => {
    setLoading(true);
    try {
      const data = await TerritoryService.getAll();
      setTerritories(data);
    } catch (err) {
      Alert.alert("Помилка", "Не вдалося завантажити території");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerritories();
  }, []);

  const handleOpenModal = (territory?: Territory) => {
    if (territory) {
      setEditingTerritory(territory);
      setName(territory.name);
    } else {
      setEditingTerritory(null);
      setName("");
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Помилка", "Введіть назву території");
      return;
    }
    setSaving(true);
    try {
      if (editingTerritory) {
        await TerritoryService.update(editingTerritory.id, { name: name.trim() });
      } else {
        await TerritoryService.create({ name: name.trim() });
      }
      setIsModalOpen(false);
      loadTerritories();
    } catch (err) {
      Alert.alert("Помилка", "Не вдалося зберегти територію");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Видалення", `Видалити територію "${name}"?`, [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          try {
            await TerritoryService.delete(id);
            loadTerritories();
          } catch (err) {
            Alert.alert("Помилка", "Не вдалося видалити територію");
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>Території</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Додати</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      ) : territories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={48} color="#9CA3AF" />
          <Text style={[styles.emptyText, isDarkMode && styles.darkSubtext]}>
            Територій поки немає. Створіть першу територію.
          </Text>
        </View>
      ) : (
        <FlatList
          data={territories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, isDarkMode && styles.darkCard]}>
              <View style={styles.cardInfo}>
                <Ionicons name="location-outline" size={20} color="#4F46E5" />
                <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>
                  {item.name}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleOpenModal(item)}
                >
                  <Ionicons name="pencil-outline" size={18} color="#4F46E5" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDelete(item.id, item.name)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Edit/Create Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isDarkMode && styles.darkCard]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
              {editingTerritory ? "Редагувати територію" : "Нова територія"}
            </Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.darkInput]}
              placeholder="Назва території (напр. Тернопіль)..."
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                disabled={saving}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? "Збереження..." : "Зберегти"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  darkContainer: {
    backgroundColor: "#111827",
  },
  darkCard: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
  },
  darkText: {
    color: "#F9FAFB",
  },
  darkSubtext: {
    color: "#9CA3AF",
  },
  darkInput: {
    backgroundColor: "#374151",
    color: "#FFFFFF",
    borderColor: "#4B5563",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelBtnText: {
    color: "#374151",
    fontWeight: "600",
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#4F46E5",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
