// src/app/AppRouter.tsx
import { useState } from "react";
import LoginScreen from "../screens/LoginScreen";
import AdminHomeScreen from "../screens/admin/AdminHomeScreen";
import ManagerHomeScreen from "../screens/manager/ManagerHomeScreen";
import ClientHomeScreen from "../screens/client/ClientHomeScreen";

// Мок користувачів
const USERS = [
  { email: "admin@test.com", password: "123456", role: "admin" },
  { email: "manager@test.com", password: "123456", role: "manager" },
  { email: "client@test.com", password: "123456", role: "client" },
];

export default function AppRouter() {
  const [user, setUser] = useState<any>(null);

  const handleLogin = (email: string, password: string) => {
    const found = USERS.find(
      (u) => u.email === email && u.password === password,
    );
    if (found) {
      console.log("✅ Logged in", found);
      setUser(found);
    } else {
      console.log("❌ Login failed", { email, password });
      alert("Невірний email або пароль");
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  switch (user.role) {
    case "admin":
      return <AdminHomeScreen onLogout={() => setUser(null)} />;
    case "manager":
      return <ManagerHomeScreen onLogout={() => setUser(null)} />;
    case "client":
      return <ClientHomeScreen onLogout={() => setUser(null)} />;
    default:
      return null;
  }
}
