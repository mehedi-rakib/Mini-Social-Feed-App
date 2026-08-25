import { useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/Avatar";
import { KeyboardAvoidingScreen } from "@/components/KeyboardAvoidingScreen";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/context/AuthContext";
import { usePost, useToggleLike } from "@/hooks/usePosts";
import { useComments, useAddComment, useToggleCommentLike } from "@/hooks/useComments";
import { useStartConversation } from "@/hooks/useChat";
import { resolveMediaUrl, ApiClientError } from "@/api/client";
import { CardShadow, Spacing } from "@/constants/theme";
import { formatRelativeTime } from "@/lib/time";
import type { Comment } from "@/api/types";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const postQuery = usePost(id);
  const commentsQuery = useComments(id);
  const toggleLike = useToggleLike();
  const addComment = useAddComment(id);
  const toggleCommentLike = useToggleCommentLike(id);
  const startConversation = useStartConversation();

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

  function onMessage(userId: string) {
    startConversation.mutate(userId, {
      onSuccess: (conversation) => router.push(`/chat/${conversation.id}`),
    });
  }

  function onOpenProfile(username: string) {
    router.push(`/profile/${username}`);
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Post" }} />
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <KeyboardAvoidingScreen style={styles.flex} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
          <View style={styles.centeredContent}>
            {postQuery.isLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : postQuery.data ? (
              <FlatList
                data={commentsQuery.data?.data ?? []}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                  <ThemedView type="backgroundElement" style={[styles.postCard, CardShadow]}>
                    <View style={styles.headerRow}>
                      <Pressable
                        onPress={() => onOpenProfile(postQuery.data!.author.username)}
                        hitSlop={6}
                        style={styles.headerLeft}
                      >
                        <Avatar username={postQuery.data.author.username} />
                        <View>
                          <ThemedText type="smallBold">@{postQuery.data.author.username}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {formatRelativeTime(postQuery.data.createdAt)}
                          </ThemedText>
                        </View>
                      </Pressable>
                      {user?.id !== postQuery.data.author.id && (
                        <Pressable onPress={() => onMessage(postQuery.data!.author.id)} hitSlop={10}>
                          <Ionicons name="chatbubble-outline" size={18} color={theme.textSecondary} />
                        </Pressable>
                      )}
                    </View>
                    <ThemedText style={styles.postContent}>{postQuery.data.content}</ThemedText>
                    {postQuery.data.imageUrl && (
                      <Image
                        source={{ uri: resolveMediaUrl(postQuery.data.imageUrl) }}
                        style={styles.postImage}
                        contentFit="cover"
                        transition={150}
                      />
                    )}
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
                renderItem={({ item }: { item: Comment }) => (
                  <View style={styles.commentRow}>
                    <Pressable onPress={() => onOpenProfile(item.user.username)} hitSlop={6}>
                      <Avatar username={item.user.username} size={28} />
                    </Pressable>
                    <View style={styles.commentBody}>
                      <View style={styles.commentHeaderRow}>
                        <Pressable onPress={() => onOpenProfile(item.user.username)} hitSlop={6}>
                          <ThemedText type="smallBold">@{item.user.username}</ThemedText>
                        </Pressable>
                        {user?.id !== item.user.id && (
                          <Pressable onPress={() => onMessage(item.user.id)} hitSlop={10}>
                            <Ionicons name="chatbubble-outline" size={15} color={theme.textSecondary} />
                          </Pressable>
                        )}
                      </View>
                      <ThemedText>{item.content}</ThemedText>
                      <View style={styles.commentFooterRow}>
                        <ThemedText type="small" themeColor="textSecondary">
                          {formatRelativeTime(item.createdAt)}
                        </ThemedText>
                        <Pressable
                          onPress={() => toggleCommentLike.mutate(item.id)}
                          hitSlop={10}
                          style={styles.commentLikeButton}
                        >
                          <ThemedText type="small" style={{ color: item.likedByMe ? theme.danger : theme.textSecondary }}>
                            {item.likedByMe ? "♥" : "♡"} {item.likeCount > 0 ? item.likeCount : ""}
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
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
        </KeyboardAvoidingScreen>
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  postContent: { fontSize: 17 },
  postImage: { width: "100%", aspectRatio: 4 / 3, borderRadius: Spacing.two },
  likeRow: { marginTop: Spacing.one },
  commentRow: { flexDirection: "row", gap: Spacing.two, paddingVertical: Spacing.two },
  commentBody: { flex: 1, gap: Spacing.half },
  commentHeaderRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  commentFooterRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  commentLikeButton: { paddingVertical: Spacing.half },
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
