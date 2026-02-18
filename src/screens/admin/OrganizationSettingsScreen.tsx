import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal } from "react-native";
import { useState, useEffect } from "react";
import { OrganizationService } from "../../services/organization.service";
import { Organization } from "../../types/organization";
import { Warehouse } from "../../types/warehouse";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

interface Props {
  onBack: () => void;
}

export default function OrganizationSettingsScreen({ onBack }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Organization | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [orgName, setOrgName] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  // Warehouse Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [whName, setWhName] = useState("");
  const [whAddress, setWhAddress] = useState("");
  const [savingWh, setSavingWh] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgData, whData] = await Promise.all([
        OrganizationService.getOrganization(),
        OrganizationService.getWarehouses(),
      ]);
      setOrg(orgData);
      setOrgName(orgData.name);
      setWarehouses(whData);
    } catch (error) {
      console.error("Failed to load organization settings", error);
      Alert.alert("Error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!org) return;
    setSavingOrg(true);
    try {
      const updated = await OrganizationService.updateOrganization({
        id: org.id,
        name: orgName,
      });
      setOrg(updated);
      Alert.alert("Success", "Organization updated");
    } catch (error) {
      console.error("Failed to save org", error);
      Alert.alert("Error", "Failed to save organization");
    } finally {
      setSavingOrg(false);
    }
  };

  const openModal = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setWhName(warehouse.name);
      setWhAddress(warehouse.address || "");
    } else {
      setEditingWarehouse(null);
      setWhName("");
      setWhAddress("");
    }
    setModalVisible(true);
  };

  const handleSaveWarehouse = async () => {
    if (!whName.trim() || !org) return;
    setSavingWh(true);
    try {
      if (editingWarehouse) {
        const updated = await OrganizationService.updateWarehouse(editingWarehouse.id, {
          name: whName,
          address: whAddress,
        });
        setWarehouses((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      } else {
        const created = await OrganizationService.createWarehouse({
          name: whName,
          address: whAddress,
          organizationId: org.id,
        });
        setWarehouses((prev) => [created, ...prev]);
      }
      setModalVisible(false);
    } catch (error) {
      console.error("Failed to save warehouse", error);
      Alert.alert("Error", "Failed to save warehouse");
    } finally {
      setSavingWh(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('organization.title', 'Organization Settings')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Organization Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('organization.details', 'Organization Details')}</Text>
          <Text style={styles.label}>{t('organization.name', 'Name')}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={orgName}
              onChangeText={setOrgName}
              placeholder="Organization Name"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={handleSaveOrg}
              disabled={savingOrg}
              style={[styles.saveButton, savingOrg && styles.disabledButton]}
            >
              <Ionicons name="save" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Warehouses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('organization.warehouses', 'Warehouses')}</Text>
            <TouchableOpacity onPress={() => openModal()} style={styles.addButton}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>{t('action.add', 'Add')}</Text>
            </TouchableOpacity>
          </View>

          {warehouses.map((wh) => (
            <View key={wh.id} style={styles.warehouseItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.whName}>{wh.name}</Text>
                {wh.address ? <Text style={styles.whAddress}>{wh.address}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => openModal(wh)} style={styles.editButton}>
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
          {warehouses.length === 0 && (
            <Text style={styles.emptyText}>{t('common.noData', 'No warehouses found')}</Text>
          )}
        </View>
      </ScrollView>

      {/* Warehouse Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingWarehouse ? t('warehouse.edit', 'Edit Warehouse') : t('warehouse.add', 'Add Warehouse')}
            </Text>

            <Text style={styles.label}>{t('common.name', 'Name')}</Text>
            <TextInput
              style={styles.input}
              value={whName}
              onChangeText={setWhName}
              placeholder="Warehouse Name"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>{t('common.address', 'Address')}</Text>
            <TextInput
              style={styles.input}
              value={whAddress}
              onChangeText={setWhAddress}
              placeholder="Address"
              placeholderTextColor="#999"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>{t('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveWarehouse}
                disabled={savingWh}
                style={[styles.modalSaveButton, savingWh && styles.disabledButton]}
              >
                <Text style={styles.modalSaveButtonText}>
                  {savingWh ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60, // Safe Area top approx
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 25,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 5,
    opacity: 0.8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  warehouseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  whName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  whAddress: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: "center",
    color: colors.text,
    opacity: 0.5,
    marginTop: 10,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: colors.text,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: "500",
  },
  modalSaveButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  modalSaveButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
