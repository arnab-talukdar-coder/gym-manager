import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { setLoggedOut } from "../utils/localAuth";

export default function LogoutButton() {
  const handleLogout = async () => {
    await setLoggedOut();
    router.replace("/pin-login");
  };
  return (
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <Text style={styles.text}>Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: "#d32f2f",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 15,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
  },
});
