import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Role = "admin" | "manager";

type User = {
  id: number;
  email: string;
  password: string;
  role: Role;
};

const USERS: User[] = [
  {
    id: 1,
    email: "admin@test.com",
    password: "123456",
    role: "admin",
  },
  {
    id: 2,
    email: "manager@test.com",
    password: "123456",
    role: "manager",
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 32,
    textAlign: "center",
  },
  text: {
    fontSize: 18,
    color: "#000",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  error: {
    color: "red",
    marginBottom: 12,
  },
});

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    setError("");

    const user = USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      setError("Невірний email або пароль");
      return;
    }

    setCurrentUser(user);
  };

  if (currentUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Вітаю, {currentUser.role.toUpperCase()}
        </Text>

        <Text>Email: {currentUser.email}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentUser(null)}
        >
          <Text style={styles.buttonText}>Log out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log in</Text>
      </TouchableOpacity>
    </View>
  );
}
