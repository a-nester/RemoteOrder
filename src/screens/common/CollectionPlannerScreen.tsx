import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth.store";
import { collectionService, CollectionItem, DaySummary } from "../../services/collection.service";
import { CounterpartyService } from "../../services/counterparty.service";
import { UsersService, User } from "../../services/users.service";
import type { Counterparty } from "../../types/counterparty";
import { useTheme } from "../../context/ThemeContext";

const DAYS_OF_WEEK = [
  { id: 1, label: "Пн", full: "Понеділок" },
  { id: 2, label: "Вт", full: "Вівторок" },
  { id: 3, label: "Ср", full: "Середа" },
  { id: 4, label: "Чт", full: "Четвер" },
  { id: 5, label: "Пт", full: "П'ятниця" },
  { id: 6, label: "Сб", full: "Субота" },
  { id: 7, label: "Нд", full: "Неділя" },
];

export default function CollectionPlannerScreen() {
  const { isDark } = useTheme();
  const isDarkMode = isDark;
  const loggedUser = useAuthStore((state) => state.user);

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Admin Switcher State
  const [managers, setManagers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isUserPickerOpen, setIsUserPickerOpen] = useState<boolean>(false);

  // Add Client Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [allCounterparties, setAllCounterparties] = useState<Counterparty[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [loadingModalClients, setLoadingModalClients] = useState<boolean>(false);
  const [addingClients, setAddingClients] = useState<boolean>(false);

  const targetUserId = loggedUser?.role === "admin"
    ? (selectedUserId || (loggedUser?.id ? String(loggedUser.id) : undefined))
    : (loggedUser?.id ? String(loggedUser.id) : undefined);

  // Fetch managers for admin switcher
  useEffect(() => {
    if (loggedUser?.role === "admin") {
      UsersService.getUsers()
        .then((users) => {
          setManagers(users.filter((u) => u.role === "manager"));
        })
        .catch((err) => console.error("Failed to load managers:", err));
    }
  }, [loggedUser]);

  // Load schedule for target user
  const loadSchedule = async () => {
    setLoading(true);
    try {
      const [scheduleData, summaryData] = await Promise.all([
        collectionService.getSchedule(targetUserId),
        collectionService.getDaySummary(selectedDay, targetUserId),
      ]);
      setItems(scheduleData);
      setDaySummary(summaryData);
    } catch (err) {
      console.error("Failed to load collection schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [targetUserId, selectedDay]);

  // Filter items for selected day
  const currentDayItems = useMemo(() => {
    return items.filter((item) => item.dayOfWeek === selectedDay);
  }, [items, selectedDay]);

  // Count items for each day badge
  const dayCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    items.forEach((item) => {
      counts[item.dayOfWeek] = (counts[item.dayOfWeek] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Handle status update
  const handleToggleStatus = async (item: CollectionItem) => {
    const nextStatusMap: Record<string, "planned" | "in_progress" | "done"> = {
      planned: "in_progress",
      in_progress: "done",
      done: "planned",
    };
    const nextStatus = nextStatusMap[item.status] || "planned";

    try {
      await collectionService.updateStatus(item.id, nextStatus);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
      );
    } catch (err) {
      Alert.alert("Помилка", "Не вдалося оновити статус візиту");
    }
  };

  // Handle delete schedule item
  const handleDeleteItem = (id: number, clientName: string) => {
    Alert.alert(
      "Видалення візиту",
      `Видалити ${clientName} з графіку?`,
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            try {
              await collectionService.deleteScheduleItem(id);
              setItems((prev) => prev.filter((i) => i.id !== id));
            } catch (err) {
              Alert.alert("Помилка", "Не вдалося видалити елемент з графіку");
            }
          },
        },
      ]
    );
  };

  // Load clients for Add Modal filtered by target manager's territories
  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    setSearchQuery("");
    setSelectedClientIds([]);
    setLoadingModalClients(true);

    try {
      const cps = await CounterpartyService.getAll();
      let visibleTerritories: string[] = [];

      if (loggedUser?.role === "admin" && targetUserId) {
        const mgr = managers.find((m) => String(m.id) === String(targetUserId));
        if (mgr?.visibleTerritories && mgr.visibleTerritories.length > 0) {
          visibleTerritories = mgr.visibleTerritories;
        }
      } else if (loggedUser?.role === "manager" && loggedUser.visibleTerritories && loggedUser.visibleTerritories.length > 0) {
        visibleTerritories = loggedUser.visibleTerritories;
      }

      if (visibleTerritories.length > 0) {
        setAllCounterparties(cps.filter((c) => c.territoryId && visibleTerritories.includes(c.territoryId)));
      } else {
        setAllCounterparties(cps);
      }
    } catch (err) {
      console.error("Failed to load counterparties:", err);
    } finally {
      setLoadingModalClients(false);
    }
  };

  const filteredCounterparties = useMemo(() => {
    if (!searchQuery.trim()) return allCounterparties;
    return allCounterparties.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allCounterparties, searchQuery]);

  const toggleSelectClient = (id: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const filteredIds = filteredCounterparties.map((c) => c.id);
    const allSelected = filteredIds.every((id) => selectedClientIds.includes(id));
    if (allSelected) {
      setSelectedClientIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedClientIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleAddClientsSubmit = async () => {
    if (selectedClientIds.length === 0) return;
    setAddingClients(true);
    try {
      const createdItems = await Promise.all(
        selectedClientIds.map((clientId) =>
          collectionService.addScheduleItem(selectedDay, clientId, targetUserId)
        )
      );
      setItems((prev) => [...prev, ...createdItems]);
      setIsAddModalOpen(false);
    } catch (err) {
      Alert.alert("Помилка", "Не вдалося додати контрагентів у графік");
    } finally {
      setAddingClients(false);
    }
  };

  const activeManagerEmail = loggedUser?.role === "admin"
    ? (managers.find((m) => String(m.id) === String(selectedUserId))?.email || "Власний планувальник (Admin)")
    : loggedUser?.email;

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Admin Switcher Header */}
      {loggedUser?.role === "admin" && (
        <View style={[styles.adminBar, isDarkMode && styles.darkCard]}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setIsUserPickerOpen(true)}
          >
            <Ionicons name="people-outline" size={18} color="#4F46E5" />
            <Text style={[styles.pickerButtonText, isDarkMode && styles.darkText]}>
              {activeManagerEmail}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Days Selector Bar */}
      <View style={styles.daysBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysBar}>
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = d.id === selectedDay;
            const count = dayCounts[d.id] || 0;
            return (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.dayTab,
                  isDarkMode && styles.darkDayTab,
                  isSelected && styles.selectedDayTab,
                ]}
                onPress={() => setSelectedDay(d.id)}
              >
                <Text
                  style={[
                    styles.dayTabLabel,
                    isDarkMode && styles.darkText,
                    isSelected && styles.selectedDayTabLabel,
                  ]}
                >
                  {d.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.badge, isSelected && styles.selectedBadge]}>
                    <Text style={[styles.badgeText, isSelected && styles.selectedBadgeText]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Day Summary Card */}
      <View style={[styles.summaryCard, isDarkMode && styles.darkCard]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.dayFullTitle, isDarkMode && styles.darkText]}>
            {DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.full}
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Додати клієнтів</Text>
          </TouchableOpacity>
        </View>

        {daySummary && (
          <View style={styles.kpiRow}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{daySummary.client_count}</Text>
              <Text style={styles.kpiLabel}>Клієнтів</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{daySummary.order_count}</Text>
              <Text style={styles.kpiLabel}>Замовлень</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{daySummary.item_count}</Text>
              <Text style={styles.kpiLabel}>Товарів</Text>
            </View>
          </View>
        )}
      </View>

      {/* Schedule Items List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : currentDayItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
          <Text style={[styles.emptyText, isDarkMode && styles.darkSubtext]}>
            На цей день візитів не заплановано
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentDayItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const statusConfig = {
              planned: { label: "Заплановано", color: "#3B82F6", bg: "#EFF6FF" },
              in_progress: { label: "В процесі", color: "#F59E0B", bg: "#FEF3C7" },
              done: { label: "Виконано", color: "#10B981", bg: "#D1FAE5" },
            }[item.status] || { label: "Заплановано", color: "#3B82F6", bg: "#EFF6FF" };

            return (
              <View style={[styles.itemCard, isDarkMode && styles.darkCard]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.clientName, isDarkMode && styles.darkText]}>
                    {item.client_name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item.id, item.client_name)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.itemFooter}>
                  <TouchableOpacity
                    style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}
                    onPress={() => handleToggleStatus(item)}
                  >
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </TouchableOpacity>

                  {(item.order_count || 0) > 0 && (
                    <Text style={styles.orderInfoText}>
                      📦 {item.order_count} замовлень ({item.product_count} од.)
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Admin Switcher Modal */}
      <Modal visible={isUserPickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isDarkMode && styles.darkCard]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
              Оберіть дашборд / планувальник:
            </Text>
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setSelectedUserId("");
                setIsUserPickerOpen(false);
              }}
            >
              <Text style={[styles.pickerOptionText, !selectedUserId && styles.activePickerText]}>
                Власний планувальник (Адміністратор)
              </Text>
            </TouchableOpacity>
            {managers.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.pickerOption}
                onPress={() => {
                  setSelectedUserId(String(m.id));
                  setIsUserPickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    String(selectedUserId) === String(m.id) && styles.activePickerText,
                  ]}
                >
                  Менеджер: {m.email}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsUserPickerOpen(false)}
            >
              <Text style={styles.closeModalButtonText}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Client Multi-Select Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBoxLarge, isDarkMode && styles.darkCard]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
                Додати контрагентів у графік
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, isDarkMode && styles.darkInput]}
                placeholder="Пошук клієнта за назвою..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.selectAllRow}>
              <Text style={[styles.selectedCountText, isDarkMode && styles.darkSubtext]}>
                Обрано: {selectedClientIds.length}
              </Text>
              {filteredCounterparties.length > 0 && (
                <TouchableOpacity onPress={toggleSelectAll}>
                  <Text style={styles.selectAllText}>
                    {filteredCounterparties.every((c) => selectedClientIds.includes(c.id))
                      ? "Зняти виділення"
                      : `Обрати всіх (${filteredCounterparties.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingModalClients ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={filteredCounterparties}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => {
                  const isSelected = selectedClientIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.clientCheckRow,
                        isSelected && styles.selectedCheckRow,
                      ]}
                      onPress={() => toggleSelectClient(item.id)}
                    >
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={20}
                        color={isSelected ? "#4F46E5" : "#9CA3AF"}
                      />
                      <Text style={[styles.clientCheckName, isDarkMode && styles.darkText]}>
                        {item.name}
                      </Text>
                      {item.territoryName && (
                        <Text style={styles.territoryTag}>{item.territoryName}</Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsAddModalOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  selectedClientIds.length === 0 && styles.disabledButton,
                ]}
                disabled={selectedClientIds.length === 0 || addingClients}
                onPress={handleAddClientsSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {addingClients ? "Збереження..." : `Додати (${selectedClientIds.length})`}
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
  darkDayTab: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
  },
  darkInput: {
    backgroundColor: "#374151",
    color: "#FFFFFF",
    borderColor: "#4B5563",
  },
  adminBar: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  daysBarContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  daysBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectedDayTab: {
    backgroundColor: "#4F46E5",
  },
  dayTabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  selectedDayTabLabel: {
    color: "#FFFFFF",
  },
  badge: {
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  selectedBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
  },
  selectedBadgeText: {
    color: "#FFFFFF",
  },
  summaryCard: {
    margin: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayFullTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  kpiItem: {
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4F46E5",
  },
  kpiLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E5E7EB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 10,
  },
  itemCard: {
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  orderInfoText: {
    fontSize: 12,
    color: "#6B7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  modalBoxLarge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  pickerOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerOptionText: {
    fontSize: 14,
    color: "#374151",
  },
  activePickerText: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  closeModalButton: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  closeModalButtonText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingLeft: 34,
    paddingRight: 10,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  selectAllRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedCountText: {
    fontSize: 12,
    color: "#6B7280",
  },
  selectAllText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "600",
  },
  clientCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 10,
  },
  selectedCheckRow: {
    backgroundColor: "#EEF2FF",
  },
  clientCheckName: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  territoryTag: {
    fontSize: 10,
    color: "#4B5563",
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#4F46E5",
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
