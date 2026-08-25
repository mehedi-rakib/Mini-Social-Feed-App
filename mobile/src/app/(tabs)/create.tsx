import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { KeyboardAvoidingScreen } from "@/components/KeyboardAvoidingScreen";
import { useTheme } from "@/hooks/use-theme";
import { useCreatePost } from "@/hooks/usePosts";
import { useImagePicker } from "@/hooks/useImagePicker";
import { Spacing } from "@/constants/theme";
import { ApiClientError } from "@/api/client";

const MAX_LENGTH = 500;

export default function CreatePostScreen() {
  const theme = useTheme();
  const router = useRouter();
  const createPost = useCreatePost();
  const { imageUri, pickImage, clearImage, isUploading, uploadIfPresent } = useImagePicker();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmedLength = content.trim().length;
  const busy = createPost.isPending || isUploading;
  const canSubmit = trimmedLength > 0 && content.length <= MAX_LENGTH && !busy;
  const overLimit = content.length > MAX_LENGTH;

  async function onSubmit() {
    setError(null);
    try {
      const imageUrl = await uploadIfPresent();
      await createPost.mutateAsync({ content: content.trim(), imageUrl });
      setContent("");
      clearImage();
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't post right now, try again.");
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <KeyboardAvoidingScreen style={styles.flex}>
          <View style={styles.content}>
            <TextInput
              placeholder="What's on your mind?"
              placeholderTextColor={theme.textSecondary}
              multiline
              value={content}
              onChangeText={setContent}
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement },
              ]}
              textAlignVertical="top"
            />

            {imageUri && (
              <View style={styles.previewWrapper}>
                <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
                <Pressable onPress={clearImage} style={styles.removeButton} hitSlop={8}>
                  <Ionicons name="close" size={16} color="#ffffff" />
                </Pressable>
              </View>
            )}

            <View style={styles.footer}>
              <Pressable onPress={pickImage} style={styles.photoButton} hitSlop={8}>
                <Ionicons name="image-outline" size={20} color={theme.primary} />
                <ThemedText themeColor="primary" type="small" style={styles.photoButtonText}>
                  {imageUri ? "Change photo" : "Add photo"}
                </ThemedText>
              </Pressable>
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
              {busy ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText style={styles.buttonText}>Post</ThemedText>
              )}
            </Pressable>
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
  content: { flex: 1, padding: Spacing.three, maxWidth: 600, width: "100%", alignSelf: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 16,
    minHeight: 160,
  },
  previewWrapper: { marginTop: Spacing.three, alignSelf: "flex-start" },
  preview: { width: 120, height: 120, borderRadius: Spacing.two },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.two,
  },
  photoButton: { flexDirection: "row", alignItems: "center", gap: Spacing.one },
  photoButtonText: { fontWeight: "600" },
  error: { textAlign: "center", marginTop: Spacing.two },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.three,
  },
  buttonText: { color: "#ffffff", fontWeight: "600" },
});
