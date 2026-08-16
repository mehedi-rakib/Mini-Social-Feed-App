import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PostCard } from "@/components/PostCard";
import { useTheme } from "@/hooks/use-theme";
import { usePosts, useToggleLike } from "@/hooks/usePosts";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Spacing } from "@/constants/theme";
import type { Post } from "@/api/types";

const CONTENT_MAX_WIDTH = 600;

export default function FeedScreen() {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 400);

  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePosts(debouncedSearch || undefined);
  const toggleLike = useToggleLike();

  const posts = useMemo<Post[]>(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const onToggleLike = useCallback((postId: string) => toggleLike.mutate(postId), [toggleLike]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.centeredContent}>
          <View
            style={[
              styles.searchWrapper,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              placeholder="Search by username"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <SkeletonList />
          ) : isError ? (
            <View style={styles.centerBox}>
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                Could not load the feed.
              </ThemedText>
              <Pressable
                onPress={() => refetch()}
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={styles.retryText}>Retry</ThemedText>
              </Pressable>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.centerBox}>
              <ThemedText themeColor="textSecondary" style={styles.centerText}>
                {debouncedSearch ? `No posts from @${debouncedSearch}` : "No posts yet - be the first"}
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PostCard post={item} onToggleLike={onToggleLike} />}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
              contentContainerStyle={styles.listContent}
              refreshing={isRefetching}
              onRefresh={refetch}
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

function SkeletonList() {
  const theme = useTheme();
  return (
    <View style={styles.listContent}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.skeletonCard, { backgroundColor: theme.backgroundElement, marginBottom: Spacing.two }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centeredContent: { flex: 1, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.three,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five },
  footerLoader: { marginVertical: Spacing.three },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.three, padding: Spacing.four },
  centerText: { textAlign: "center" },
  retryButton: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: Spacing.three },
  retryText: { color: "#ffffff", fontWeight: "600" },
  skeletonCard: { height: 96, borderRadius: Spacing.three },
});
