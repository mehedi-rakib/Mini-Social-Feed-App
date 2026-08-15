import { Tabs } from "expo-router";
import { Pressable } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/context/AuthContext";
import { teardownPushNotifications } from "@/lib/notifications";

export default function TabsLayout() {
  const theme = useTheme();
  const { logout } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        headerRight: () => (
          <Pressable
            onPress={async () => {
              await teardownPushNotifications();
              await logout();
            }}
            hitSlop={12}
            style={{ marginRight: 16 }}
          >
            <ThemedText themeColor="primary">Log out</ThemedText>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Feed" }} />
      <Tabs.Screen name="create" options={{ title: "New Post" }} />
    </Tabs>
  );
}
