import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { checkLoggedIn } from "../../utils/localAuth";

export default function ProtectedLayout() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const loggedIn = await checkLoggedIn();

      if (!loggedIn) {
        router.replace("/pin-login");
      }

      setLoading(false);
    };

    verify();
  }, []);

  if (loading) {
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

  return <Stack screenOptions={{ headerShown: false }} />;
}
