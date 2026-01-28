// src/screens/manager/ManagerHomeScreen.tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = { onLogout?: () => void };

export default function ManagerHomeScreen({ onLogout }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manager Home</Text>
      <Text style={styles.text}>
        Це сторінка менеджера. Тут збираємо замовлення.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onLogout}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#e0f7fa",
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 16 },
  text: { fontSize: 18, marginBottom: 32 },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
});
