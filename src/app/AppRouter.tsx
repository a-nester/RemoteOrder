import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../store/auth.store";

import LoginScreen from "../screens/LoginScreen";
import AdminHomeScreen from "../screens/admin/AdminHomeScreen";
import ManagerHomeScreen from "../screens/manager/ManagerHomeScreen";
import ClientHomeScreen from "../screens/client/ClientHomeScreen";

export default function AppRouter() {
  const { user, isHydrated } = useAuthStore();

  // ⏳ ЧЕКАЄМО ВІДНОВЛЕННЯ STORE
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) return <LoginScreen />;

  switch (user.role) {
    case "admin":
      return <AdminHomeScreen />;
    case "manager":
      return <ManagerHomeScreen />;
    case "client":
      return <ClientHomeScreen />;
    default:
      return null;
  }
}
