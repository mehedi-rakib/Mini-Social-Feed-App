import { useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { usePost, useToggleLike } from "@/hooks/usePosts";
import { useComments, useAddComment } from "@/hooks/useComments";
import { Spacing } from "@/constants/theme";
import { formatRelativeTime } from "@/lib/time";
import { ApiClientError } from "@/api/client";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const postQuery = usePost(id);
  const commentsQuery = useComments(id);
  const toggleLike = useToggleLike();
  const addComment = useAddComment(id);

  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSend() {
    const content = text.trim();
    if (!content) return;
    setError(null);
    try {
      await addComment.mutateAsync(content);
      setText("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't send that comment.");
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Post" }} />
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View style={styles.centeredContent}>
            {postQuery.isLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : postQuery.data ? (
              <FlatList
                data={commentsQuery.data?.data ?? []}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                  <ThemedView type="backgroundElement" style={styles.postCard}>
                    <View style={styles.headerRow}>
                      <ThemedText type="smallBold">@{postQuery.data.author.username}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatRelativeTime(postQuery.data.createdAt)}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.postContent}>{postQuery.data.content}</ThemedText>
                    <Pressable
                      style={styles.likeRow}
                      onPress={() => toggleLike.mutate(postQuery.data!.id)}
                      hitSlop={8}
                    >
                      <ThemedText style={{ color: postQuery.data.likedByMe ? theme.danger : theme.textSecondary }}>
                        {postQuery.data.likedByMe ? "♥" : "♡"} {postQuery.data.likeCount} ·{" "}
                        {postQuery.data.commentCount} comments
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                }
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <ThemedText type="smallBold">@{item.user.username}</ThemedText>
                    <ThemedText>{item.content}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatRelativeTime(item.createdAt)}
                    </ThemedText>
                  </View>
                )}
                ListEmptyComponent={
                  !commentsQuery.isLoading ? (
                    <ThemedText themeColor="textSecondary" style={styles.emptyComments}>
                      No comments yet.
                    </ThemedText>
                  ) : null
                }
              />
            ) : (
              <ThemedText style={styles.loader}>Post not found.</ThemedText>
            )}

            <View style={[styles.composer, { borderColor: theme.border }]}>
              <View
                style={[
                  styles.composerInputWrapper,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
              >
                <TextInput
                  placeholder="Add a comment..."
                  placeholderTextColor={theme.textSecondary}
                  value={text}
                  onChangeText={setText}
                  style={[styles.composerInput, { color: theme.text }]}
                  multiline
                />
              </View>
              <Pressable
                onPress={onSend}
                disabled={!text.trim() || addComment.isPending}
                hitSlop={8}
                style={[
                  styles.sendButton,
                  { backgroundColor: text.trim() ? theme.primary : theme.backgroundElement },
                ]}
              >
                <Ionicons name="arrow-up" size={18} color={text.trim() ? "#ffffff" : theme.textSecondary} />
              </Pressable>
            </View>
            {error && (
              <ThemedText themeColor="danger" type="small" style={styles.composerError}>
                {error}
              </ThemedText>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  centeredContent: { flex: 1, width: "100%", maxWidth: 600, alignSelf: "center" },
  loader: { marginTop: Spacing.five, textAlign: "center" },
  listContent: { padding: Spacing.three, gap: Spacing.three },
  postCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  postContent: { fontSize: 17 },
  likeRow: { marginTop: Spacing.one },
  commentRow: { paddingVertical: Spacing.two, gap: Spacing.half },
  emptyComments: { textAlign: "center", marginTop: Spacing.four },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.two,
    borderTopWidth: 1,
    padding: Spacing.three,
  },
  composerInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    maxHeight: 120,
  },
  composerInput: { fontSize: 15 },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  composerError: { textAlign: "center", paddingBottom: Spacing.two },
});
