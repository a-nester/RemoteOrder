import { useAuthStore } from "../store/auth.store";
import AdminHomeScreen from "../screens/admin/AdminHomeScreen";
import ManagerHomeScreen from "../screens/manager/ManagerHomeScreen";
import ClientHomeScreen from "../screens/client/ClientHomeScreen";
import LoginScreen from "../screens/LoginScreen";

export default function AppRouter() {
  const user = useAuthStore((s) => s.user);

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
