import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/use-theme";
import { useConversations } from "@/hooks/useChat";
import { CardShadow, Spacing } from "@/constants/theme";
import { formatRelativeTime } from "@/lib/time";
import type { Conversation } from "@/api/types";

const CONTENT_MAX_WIDTH = 600;

export default function ChatListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useConversations();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.centeredContent}>
          {isLoading ? (
            <SkeletonList />
          ) : isError ? (
            <View style={styles.centerBox}>
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                Could not load your conversations.
              </ThemedText>
              <Pressable onPress={() => refetch()} style={[styles.retryButton, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.retryText}>Retry</ThemedText>
              </Pressable>
            </View>
          ) : !data || data.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="chatbubbles-outline" size={40} color={theme.textSecondary} />
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                No conversations yet — message someone from the feed to start chatting.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ConversationRow conversation={item} onPress={() => router.push(`/chat/${item.id}`)} />
              )}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[theme.primary]} tintColor={theme.primary} />
              }
            />
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function ConversationRow({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) {
  const router = useRouter();

  return (
    <Pressable onPress={onPress}>
      <ThemedView type="backgroundElement" style={[styles.row, CardShadow]}>
        <Pressable onPress={() => router.push(`/profile/${conversation.otherUser.username}`)} hitSlop={6}>
          <Avatar username={conversation.otherUser.username} size={44} />
        </Pressable>
        <View style={styles.rowBody}>
          <View style={styles.rowHeader}>
            <Pressable onPress={() => router.push(`/profile/${conversation.otherUser.username}`)} hitSlop={6}>
              <ThemedText type="smallBold">@{conversation.otherUser.username}</ThemedText>
            </Pressable>
            <ThemedText type="small" themeColor="textSecondary">
              {formatRelativeTime(conversation.lastMessageAt)}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {conversation.lastMessagePreview ?? "Say hello 👋"}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

function SkeletonList() {
  const theme = useTheme();
  return (
    <View style={styles.listContent}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.skeletonRow, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centeredContent: { flex: 1, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five, paddingTop: Spacing.three },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  rowBody: { flex: 1, gap: Spacing.half },
  rowHeader: { flexDirection: "row", justifyContent: "space-between" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.three, padding: Spacing.four },
  centerText: { textAlign: "center" },
  retryButton: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: Spacing.three },
  retryText: { color: "#ffffff", fontWeight: "600" },
  skeletonRow: { height: 72, borderRadius: Spacing.three },
});
