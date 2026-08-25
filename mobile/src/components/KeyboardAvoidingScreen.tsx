import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from "react-native";

interface KeyboardAvoidingScreenProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
}

// Every screen with a text composer at the bottom needs this same Android
// behavior - `"height"` (not the default `undefined`) is required for the
// keyboard to actually push content up under this SDK's edge-to-edge
// rendering, see mobile/README.md. Centralized here so a new composer
// screen can't omit it and reintroduce the bug.
export function KeyboardAvoidingScreen({ children, style, keyboardVerticalOffset }: KeyboardAvoidingScreenProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={style}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
