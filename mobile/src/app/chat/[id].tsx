import { useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { KeyboardAvoidingScreen } from "@/components/KeyboardAvoidingScreen";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/context/AuthContext";
import { useConversation, useMessages, useSendMessage } from "@/hooks/useChat";
import { useImagePicker } from "@/hooks/useImagePicker";
import { resolveMediaUrl, ApiClientError } from "@/api/client";
import { Spacing } from "@/constants/theme";
import { formatRelativeTime } from "@/lib/time";
import type { Message } from "@/api/types";

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { user } = useAuth();

  const conversationQuery = useConversation(id);
  const messagesQuery = useMessages(id);
  const { imageUri, pickImage, clearImage, isUploading, uploadIfPresent } = useImagePicker();
  const sendMessage = useSendMessage(id, user ? { id: user.id, username: user.username } : { id: "", username: "" });

  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const messages = messagesQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const canSend = (text.trim().length > 0 || !!imageUri) && !sendMessage.isPending && !isUploading;

  async function onSend() {
    const content = text.trim();
    if (!content && !imageUri) return;
    setError(null);
    try {
      const imageUrl = await uploadIfPresent();
      await sendMessage.mutateAsync({ content: content || undefined, imageUrl });
      setText("");
      clearImage();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't send that message.");
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{ title: conversationQuery.data ? `@${conversationQuery.data.otherUser.username}` : "Chat" }}
      />
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <KeyboardAvoidingScreen style={styles.flex} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
          <View style={styles.centeredContent}>
            {messagesQuery.isLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : messagesQuery.isError ? (
              <View style={styles.centerBox}>
                <ThemedText themeColor="textSecondary" style={styles.centerText}>
                  Could not load this conversation.
                </ThemedText>
                <Pressable
                  onPress={() => messagesQuery.refetch()}
                  style={[styles.retryButton, { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={styles.retryText}>Retry</ThemedText>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                inverted
                contentContainerStyle={styles.listContent}
                renderItem={({ item }: { item: Message }) => (
                  <MessageBubble message={item} isOwn={item.sender.id === user?.id} />
                )}
                onEndReachedThreshold={0.4}
                onEndReached={() => {
                  if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) messagesQuery.fetchNextPage();
                }}
                ListFooterComponent={
                  messagesQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} /> : null
                }
                ListEmptyComponent={
                  <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                    Say hello 👋
                  </ThemedText>
                }
              />
            )}

            {imageUri && (
              <View style={styles.previewWrapper}>
                <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
                <Pressable onPress={clearImage} style={styles.removeButton} hitSlop={8}>
                  <Ionicons name="close" size={14} color="#ffffff" />
                </Pressable>
              </View>
            )}

            <View style={[styles.composer, { borderColor: theme.border }]}>
              <Pressable onPress={pickImage} hitSlop={8} style={styles.attachButton}>
                <Ionicons name="image-outline" size={22} color={theme.textSecondary} />
              </Pressable>
              <View
                style={[
                  styles.composerInputWrapper,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
              >
                <TextInput
                  placeholder="Message..."
                  placeholderTextColor={theme.textSecondary}
                  value={text}
                  onChangeText={setText}
                  style={[styles.composerInput, { color: theme.text }]}
                  multiline
                />
              </View>
              <Pressable
                onPress={onSend}
                disabled={!canSend}
                hitSlop={8}
                style={[styles.sendButton, { backgroundColor: canSend ? theme.primary : theme.backgroundElement }]}
              >
                {isUploading || sendMessage.isPending ? (
                  <ActivityIndicator size="small" color={canSend ? "#ffffff" : theme.textSecondary} />
                ) : (
                  <Ionicons name="arrow-up" size={18} color={canSend ? "#ffffff" : theme.textSecondary} />
                )}
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

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.bubbleRow, isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther]}>
      <View style={[styles.bubble, { backgroundColor: isOwn ? theme.primary : theme.backgroundElement }]}>
        {message.imageUrl && (
          <Image source={{ uri: resolveMediaUrl(message.imageUrl) }} style={styles.bubbleImage} contentFit="cover" />
        )}
        {message.content && <ThemedText style={{ color: isOwn ? "#ffffff" : theme.text }}>{message.content}</ThemedText>}
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.bubbleTime}>
        {formatRelativeTime(message.createdAt)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  centeredContent: { flex: 1, width: "100%", maxWidth: 600, alignSelf: "center" },
  loader: { marginTop: Spacing.five },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.three, padding: Spacing.four },
  centerText: { textAlign: "center" },
  retryButton: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: Spacing.three },
  retryText: { color: "#ffffff", fontWeight: "600" },
  listContent: { padding: Spacing.three, gap: Spacing.two, flexGrow: 1 },
  footerLoader: { marginVertical: Spacing.three },
  emptyText: { textAlign: "center", marginTop: Spacing.five, transform: [{ scaleY: -1 }] },
  bubbleRow: { maxWidth: "80%", marginVertical: Spacing.half },
  bubbleRowOwn: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubbleRowOther: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { borderRadius: Spacing.three, padding: Spacing.two, gap: Spacing.one },
  bubbleImage: { width: 180, height: 180, borderRadius: Spacing.two },
  bubbleTime: { marginTop: Spacing.half, fontSize: 11 },
  previewWrapper: { marginHorizontal: Spacing.three, marginTop: Spacing.two, alignSelf: "flex-start" },
  preview: { width: 72, height: 72, borderRadius: Spacing.two },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.two,
    borderTopWidth: 1,
    padding: Spacing.three,
  },
  attachButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  composerInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    maxHeight: 120,
  },
  composerInput: { fontSize: 15 },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  composerError: { textAlign: "center", paddingBottom: Spacing.two },
});
