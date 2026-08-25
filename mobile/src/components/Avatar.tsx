import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";

const PALETTE = ["#C97B5C", "#5C8A72", "#5C7BC9", "#B5588F", "#C9A05C", "#7B5CC9", "#5CA3C9"];

function colorForUsername(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  username: string;
  size?: number;
}

export function Avatar({ username, size = 36 }: AvatarProps) {
  const initial = username.trim().charAt(0).toUpperCase() || "?";

  return (
    <View
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: colorForUsername(username) }]}
    >
      <ThemedText style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  initial: { color: "#ffffff", fontWeight: "700" },
});
