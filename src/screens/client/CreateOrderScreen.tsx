import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuthStore } from "../../store/auth.store";
import { useOrdersStore } from "../../store/orders.store";
import { uuidv4 } from "../../utils/uuid";

export default function CreateOrderScreen() {
  const user = useAuthStore((s) => s.user);
  const addOrder = useOrdersStore((s) => s.addOrder);

  const handleCreate = async () => {
    if (!user) return;

    await addOrder({
      id: uuidv4(),
      clientId: user.id.toString(),
      clientEmail: user.email,
      status: "draft",
      createdAt: Date.now(),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Order</Text>

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Create order</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
});
