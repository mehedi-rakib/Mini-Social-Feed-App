import { Pressable, StyleSheet, type PressableProps } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";

interface AuthButtonProps extends PressableProps {
  label: string;
  disabled?: boolean;
}

export function AuthButton({ label, disabled, style, ...rest }: AuthButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        styles.button,
        { backgroundColor: theme.primary, opacity: disabled ? 0.5 : 1 },
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      <ThemedText style={styles.label}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  label: { color: "#ffffff", fontWeight: "700", fontSize: 16, letterSpacing: 0.2 },
});
