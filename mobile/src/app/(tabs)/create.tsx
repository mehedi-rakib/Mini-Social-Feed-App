import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { useCreatePost } from "@/hooks/usePosts";
import { Spacing } from "@/constants/theme";
import { ApiClientError } from "@/api/client";

const MAX_LENGTH = 500;

export default function CreatePostScreen() {
  const theme = useTheme();
  const router = useRouter();
  const createPost = useCreatePost();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmedLength = content.trim().length;
  const canSubmit = trimmedLength > 0 && content.length <= MAX_LENGTH && !createPost.isPending;
  const overLimit = content.length > MAX_LENGTH;

  async function onSubmit() {
    setError(null);
    try {
      await createPost.mutateAsync(content.trim());
      setContent("");
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't post right now, try again.");
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <View style={styles.content}>
            <TextInput
              placeholder="What's on your mind?"
              placeholderTextColor={theme.textSecondary}
              multiline
              value={content}
              onChangeText={setContent}
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              textAlignVertical="top"
            />
            <View style={styles.footer}>
              <ThemedText themeColor={overLimit ? "danger" : "textSecondary"} type="small">
                {content.length}/{MAX_LENGTH}
              </ThemedText>
            </View>

            {error && (
              <ThemedText themeColor="danger" style={styles.error}>
                {error}
              </ThemedText>
            )}

            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              style={[styles.button, { backgroundColor: theme.primary, opacity: canSubmit ? 1 : 0.5 }]}
            >
              <ThemedText style={styles.buttonText}>{createPost.isPending ? "Posting..." : "Post"}</ThemedText>
            </Pressable>
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
  content: { flex: 1, padding: Spacing.three, maxWidth: 600, width: "100%", alignSelf: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    fontSize: 16,
    minHeight: 160,
  },
  footer: { alignItems: "flex-end", marginTop: Spacing.one },
  error: { textAlign: "center", marginTop: Spacing.two },
  button: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.three,
  },
  buttonText: { color: "#ffffff", fontWeight: "600" },
});
