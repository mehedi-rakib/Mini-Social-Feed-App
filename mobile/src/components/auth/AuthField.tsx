import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { CardShadow, Spacing } from "@/constants/theme";

interface AuthFieldProps extends TextInputProps {
  error?: string;
}

export function AuthField({ error, style, ...rest }: AuthFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          CardShadow,
          { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <ThemedText themeColor="danger" type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.half },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  error: { paddingHorizontal: Spacing.one },
});
