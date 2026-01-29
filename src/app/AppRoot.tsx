import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { initDatabase } from "../db/database";
import AppRouter from "./AppRouter";

export default function AppRoot() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  if (!ready) {
    return <ActivityIndicator size="large" />;
  }

  return <AppRouter />;
}
