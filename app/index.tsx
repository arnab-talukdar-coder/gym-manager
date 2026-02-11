import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { checkLoggedIn } from "../utils/localAuth";

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await checkLoggedIn();

      if (loggedIn) {
        router.replace("/protected/dashboard");
      } else {
        router.replace("/pin-login");
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color="#2196F3" />
    </View>
  );
}
