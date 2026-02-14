import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { setLoggedOut } from "../../../utils/localAuth";

function TabsContent() {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const confirmLogout = async () => {
    setLogoutVisible(false);
    await setLoggedOut();
    router.replace("/pin-login");
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: "#2563eb",
          tabBarLabelStyle: {
            fontSize: 12,
            marginBottom: Platform.OS === "android" ? 4 : 0,
          },
          tabBarStyle: {
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 6,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setLogoutVisible(true)}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="members"
          options={{
            title: "Members",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="monthly-report"
          options={{
            title: "Reports",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* 🔥 Logout Modal */}
      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Ionicons name="log-out-outline" size={28} color="#ef4444" />

            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalText}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.buttonRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.logoutButton} onPress={confirmLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function TabsLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TabsContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    color: "#111827",
  },
  modalText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cancelText: {
    color: "#374151",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
});
