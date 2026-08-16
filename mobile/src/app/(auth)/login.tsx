import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/api/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton } from "@/components/auth/AuthButton";

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  async function onSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Log in to continue"
      footer={
        <Link href="/signup" asChild>
          <Pressable hitSlop={8}>
            <ThemedText themeColor="textSecondary">
              No account? <ThemedText themeColor="primary">Sign up</ThemedText>
            </ThemedText>
          </Pressable>
        </Link>
      }
    >
      <AuthField
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <AuthField
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />

      {error && (
        <ThemedText themeColor="danger" style={styles.error}>
          {error}
        </ThemedText>
      )}

      <AuthButton label={isSubmitting ? "Logging in..." : "Log in"} onPress={onSubmit} disabled={!canSubmit} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  error: { textAlign: "center" },
});
