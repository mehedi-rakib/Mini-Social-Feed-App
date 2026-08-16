import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// expo-secure-store has no web implementation (its web module is an empty
// stub), so calling it on web throws instead of persisting anything. Fall
// back to AsyncStorage there, which is backed by localStorage on web and
// still uses native secure storage (Keychain/Keystore) on iOS/Android.
const isWeb = Platform.OS === "web";

export function getToken(key: string): Promise<string | null> {
  return isWeb ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
}

export function setToken(key: string, value: string): Promise<void> {
  return isWeb ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
}

export function deleteToken(key: string): Promise<void> {
  return isWeb ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);
}
