import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";
import { ApiClientError } from "@/api/client";

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export default function SignupScreen() {
  const { signup } = useAuth();
  const theme = useTheme();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (username.length < 3 || username.length > 20) errors.username = "3-20 characters";
    else if (!USERNAME_RE.test(username)) errors.username = "Letters, numbers, underscores only";
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email";
    if (password.length < 8) errors.password = "At least 8 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit() {
    setError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await signup(username.trim(), email.trim(), password, displayName.trim() || undefined);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = username.length > 0 && email.length > 0 && password.length > 0 && !isSubmitting;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <ThemedText type="title" style={styles.title}>
              Create account
            </ThemedText>

            <View style={styles.field}>
              <TextInput
                placeholder="Username"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
              {fieldErrors.username && (
                <ThemedText themeColor="danger" type="small">
                  {fieldErrors.username}
                </ThemedText>
              )}
            </View>

            <View style={styles.field}>
              <TextInput
                placeholder="Display name (optional)"
                placeholderTextColor={theme.textSecondary}
                value={displayName}
                onChangeText={setDisplayName}
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
            </View>

            <View style={styles.field}>
              <TextInput
                placeholder="Email"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
              {fieldErrors.email && (
                <ThemedText themeColor="danger" type="small">
                  {fieldErrors.email}
                </ThemedText>
              )}
            </View>

            <View style={styles.field}>
              <TextInput
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
              {fieldErrors.password && (
                <ThemedText themeColor="danger" type="small">
                  {fieldErrors.password}
                </ThemedText>
              )}
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
              <ThemedText style={styles.buttonText}>{isSubmitting ? "Creating..." : "Create account"}</ThemedText>
            </Pressable>

            <Link href="/login" asChild>
              <Pressable style={styles.linkRow}>
                <ThemedText themeColor="textSecondary">
                  Have an account? <ThemedText themeColor="primary">Log in</ThemedText>
                </ThemedText>
              </Pressable>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  form: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.two,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  title: { textAlign: "center", marginBottom: Spacing.three },
  field: { marginBottom: Spacing.one, gap: Spacing.half },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  error: { textAlign: "center" },
  button: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  buttonText: { color: "#ffffff", fontWeight: "600" },
  linkRow: { alignItems: "center", marginTop: Spacing.three },
});
