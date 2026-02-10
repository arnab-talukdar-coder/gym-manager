import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
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
        collection(db, "Users"),
        where("phone", "==", phone),
        where("pin", "==", pin)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        await AsyncStorage.setItem("user", phone);
        setPhone("");
        setPin("");
        router.replace("/dashboard");
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
      <View style={styles.card}>
        {/* LOGO */}
        <View style={styles.logoWrapper}>
          <Image
            source={require("../assets/images/TFJ_Print_Original.png")}
            style={styles.logo}
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>

        <Text style={styles.title}>Login To Continue</Text>

        <TextInput
          placeholder="Phone Number"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="numeric"
        />

        <TextInput
          placeholder="4-digit PIN"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  logoWrapper: {
    backgroundColor: "#000",
    alignSelf: "center",
    padding: 8,
    borderRadius: 14,
  
    // 🌟 WHITE SHADOW / GLOW
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  
    // Android glow
    elevation: 6,
  
    marginBottom: 16,
  },

  logo: {
    width: 150,
    height: 120,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    marginBottom: 14,
  },

  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  errorText: {
    color: "#dc2626",
    marginTop: 12,
    textAlign: "center",
    fontSize: 13,
  },
});
