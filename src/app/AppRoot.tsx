import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { initDB } from "../db/database";
import AppRouter from "./AppRouter";

export default function AppRoot() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDB().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading database...</Text>
      </View>
    );
  }

  return <AppRouter />;
}
