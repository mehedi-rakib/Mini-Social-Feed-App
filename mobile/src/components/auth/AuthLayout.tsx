import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";

interface AuthLayoutProps {
  heading: string;
  subheading: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ heading, subheading, footer, children }: AuthLayoutProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <View style={[styles.brandMark, { backgroundColor: theme.primary }]} />
                <ThemedText themeColor="textSecondary" style={styles.brandText}>
                  MINI SOCIAL
                </ThemedText>
              </View>
              <ThemedText type="title" style={styles.heading}>
                {heading}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subheading}>
                {subheading}
              </ThemedText>
            </View>

            <View style={styles.form}>{children}</View>

            <View style={styles.footer}>{footer}</View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.six,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  header: { alignItems: "center", marginBottom: Spacing.five },
  brandRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two, marginBottom: Spacing.three },
  brandMark: { width: 10, height: 10, borderRadius: 3 },
  brandText: { fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  heading: { textAlign: "center", fontSize: 30, lineHeight: 36 },
  subheading: { textAlign: "center", marginTop: Spacing.one, fontSize: 15 },
  form: { gap: Spacing.three },
  footer: { alignItems: "center", marginTop: Spacing.four },
});
