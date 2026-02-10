import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import { setLoggedIn } from "../utils/localAuth";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";

export default function PinLogin() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!phone || !pin) {
      setError("Please enter phone number and PIN");
      return;
    }

    try {
      setLoading(true);

      const q = query(
        collection(db, "Users"), // ⚠️ make sure this matches Firestore exactly
        where("phone", "==", phone),
        where("pin", "==", pin),
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        await AsyncStorage.setItem("user", phone);
        setPhone("");
        setPin("");
        await setLoggedIn();
        router.replace("/protected/dashboard");
      } else {
        setError("Invalid phone or PIN");
      }
    } catch (err) {
      console.log(err);
      setError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gym Login</Text>

      <TextInput
        placeholder="Phone Number"
        placeholderTextColor="#999"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="numeric"
        autoCorrect={false}
        autoComplete="off"
        importantForAutofill="no"
        textContentType="none"
      />

      <TextInput
        placeholder="4-digit PIN"
        placeholderTextColor="#999"
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        keyboardType="numeric"
        autoCorrect={false}
        autoComplete="off"
        importantForAutofill="no"
        textContentType="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* Modern Inline Error */}
      {error !== "" && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 25,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1c1c1c",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  errorText: {
    color: "#ff4d4d",
    marginTop: 12,
    textAlign: "center",
  },
});
