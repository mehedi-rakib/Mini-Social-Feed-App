import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/api/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton } from "@/components/auth/AuthButton";

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export default function SignupScreen() {
  const { signup } = useAuth();

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
    <AuthLayout
      heading="Create account"
      subheading="Join Mini Social in a few seconds"
      footer={
        <Link href="/login" asChild>
          <Pressable hitSlop={8}>
            <ThemedText themeColor="textSecondary">
              Have an account? <ThemedText themeColor="primary">Log in</ThemedText>
            </ThemedText>
          </Pressable>
        </Link>
      }
    >
      <AuthField
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        error={fieldErrors.username}
      />
      <AuthField placeholder="Display name (optional)" value={displayName} onChangeText={setDisplayName} />
      <AuthField
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
      />
      <AuthField
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
      />

      {error && (
        <ThemedText themeColor="danger" style={styles.error}>
          {error}
        </ThemedText>
      )}

      <AuthButton
        label={isSubmitting ? "Creating..." : "Create account"}
        onPress={onSubmit}
        disabled={!canSubmit}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  error: { textAlign: "center" },
});
