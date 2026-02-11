import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const KEY = "gym_owner_logged_in";

export const setLoggedIn = async () => {
  if (Platform.OS === "web") {
    localStorage.setItem(KEY, "true");
  } else {
    await AsyncStorage.setItem(KEY, "true");
  }
};

export const setLoggedOut = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem(KEY);
  } else {
    await AsyncStorage.removeItem(KEY);
  }
};

export const checkLoggedIn = async () => {
  if (Platform.OS === "web") {
    return localStorage.getItem(KEY) === "true";
  } else {
    const value = await AsyncStorage.getItem(KEY);
    return value === "true";
  }
};
