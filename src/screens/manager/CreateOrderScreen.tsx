import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  onBack: () => void;
}

export default function CreateOrderScreen({ onBack }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Створити нове замовлення</Text>
      <View style={styles.content}>
        <Text>Форма для створення замовлення буде тут</Text>
      </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    padding: 15,
    backgroundColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
  },
});
