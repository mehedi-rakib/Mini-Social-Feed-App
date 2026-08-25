import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/context/AuthContext";
import { useUserPosts, useToggleLike } from "@/hooks/usePosts";
import { useStartConversation } from "@/hooks/useChat";
import { Spacing } from "@/constants/theme";
import type { Post } from "@/api/types";

const CONTENT_MAX_WIDTH = 600;

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const startConversation = useStartConversation();

  const isOwnProfile = user?.username.toLowerCase() === username?.toLowerCase();

  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUserPosts(username);
  const toggleLike = useToggleLike();

  const posts = useMemo<Post[]>(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const hasMore = data?.pages[data.pages.length - 1]?.meta.hasMore ?? false;
  const authorId = posts[0]?.author.id;

  const onToggleLike = useCallback((postId: string) => toggleLike.mutate(postId), [toggleLike]);

  function onMessage() {
    if (!authorId) return;
    startConversation.mutate(authorId, {
      onSuccess: (conversation) => router.push(`/chat/${conversation.id}`),
    });
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `@${username ?? ""}` }} />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.centeredContent}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Avatar username={username ?? "?"} size={72} />
            <ThemedText type="title" style={styles.username}>
              @{username}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.postCount}>
              {posts.length}
              {hasMore ? "+" : ""} {posts.length === 1 ? "post" : "posts"}
            </ThemedText>

            {!isOwnProfile && authorId && (
              <Pressable
                onPress={onMessage}
                disabled={startConversation.isPending}
                style={[styles.messageButton, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#ffffff" />
                <ThemedText style={styles.messageButtonText}>Message</ThemedText>
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : isError ? (
            <View style={styles.centerBox}>
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                Could not load this profile.
              </ThemedText>
              <Pressable onPress={() => refetch()} style={[styles.retryButton, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.retryText}>Retry</ThemedText>
              </Pressable>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="images-outline" size={40} color={theme.textSecondary} />
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PostCard post={item} onToggleLike={onToggleLike} />}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[theme.primary]} tintColor={theme.primary} />
              }
              onEndReachedThreshold={0.4}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) fetchNextPage();
              }}
              ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} /> : null}
            />
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centeredContent: { flex: 1, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  header: {
    alignItems: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
  },
  username: { marginTop: Spacing.one },
  postCount: {},
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    marginTop: Spacing.two,
  },
  messageButtonText: { color: "#ffffff", fontWeight: "600" },
  loader: { marginTop: Spacing.five },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five, paddingTop: Spacing.three },
  footerLoader: { marginVertical: Spacing.three },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.three, padding: Spacing.four },
  centerText: { textAlign: "center" },
  retryButton: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: Spacing.three },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
