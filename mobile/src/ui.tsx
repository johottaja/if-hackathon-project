import React, { useState } from "react";
import {
  Pressable as NativePressable,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
export function Tap({
  style,
  onPressIn,
  onPressOut,
  ...props
}: React.ComponentProps<typeof NativePressable>) {
  const [pressed, setPressed] = useState(false);
  return (
    <NativePressable
      {...props}
      style={typeof style === "function" ? style({ pressed }) : style}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
    />
  );
}
const Pressable = Tap;
export const colors = {
  blue: "#2446ed",
  ink: "#292722",
  muted: "#615e58",
  line: "#e4e0d9",
  bg: "#f5f3ef",
  green: "#287252",
};
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.secondary : null,
        { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
      ]}
    >
      {icon ? (
        <Ionicons
          accessible={false}
          name={icon}
          size={18}
          color={secondary ? colors.blue : "#fff"}
        />
      ) : null}
      <Text
        style={[styles.buttonText, secondary ? { color: colors.blue } : null]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons
        accessible={false}
        name="leaf-outline"
        size={28}
        color={colors.blue}
      />
      <Text style={styles.h3}>{title}</Text>
      <Text style={styles.body}>{description}</Text>
    </View>
  );
}
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 20,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "400",
    letterSpacing: -0.8,
    color: colors.ink,
  },
  h2: {
    fontSize: 23,
    fontWeight: "600",
    letterSpacing: -0.6,
    color: colors.ink,
  },
  h3: { fontSize: 16, fontWeight: "600", color: colors.ink },
  body: { fontSize: 16, lineHeight: 24, color: colors.muted },
  small: { fontSize: 13, lineHeight: 19, color: colors.muted },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.blue,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    backgroundColor: colors.blue,
    minHeight: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  secondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#b9c6d4",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: colors.ink,
    minHeight: 50,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: "600",
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#fff",
    minHeight: 44,
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
  chipText: { fontSize: 12, fontWeight: "500", color: colors.muted },
  chipTextSelected: { color: "#fff" },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#edf3ff",
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: colors.blue },
  divider: { height: 1, backgroundColor: colors.line },
  empty: { padding: 24, alignItems: "center", gap: 12 },
  notice: { backgroundColor: "#eaf4ed", padding: 16, borderRadius: 12 },
  danger: { color: "#a32c25", fontSize: 13, lineHeight: 20 },
});
