import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { brandMascot, type MascotExpression } from "../../constants/brandAssets";
import { gutter, radii, type, ui } from "../../constants/theme";
import { Icon, type IconName } from "./Icon";

export { Icon, type IconName } from "./Icon";

/* ─── Screen & header ───────────────────────────────────────────────────── */

/** Root of every signed-in screen: canvas background + top safe area (tab bar owns the bottom). */
export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

/** Large-title header: small context line, title, optional trailing accessory. */
export function ScreenHeader({
  title,
  eyebrow,
  subtitle,
  right,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {eyebrow ? <Text style={styles.headerEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

/** Group label above a list or card stack. */
export function SectionHeader({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {trailing}
    </View>
  );
}

/* ─── Surfaces ──────────────────────────────────────────────────────────── */

export function Card({
  children,
  style,
  onPress,
  accent,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Coloured left edge for urgent/critical items. */
  accent?: string;
}) {
  const content = (
    <>
      {accent ? <View style={[styles.cardAccent, { backgroundColor: accent }]} /> : null}
      {children}
    </>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{content}</View>;
}

/** Label / value row. Stack several inside a Card; separators are drawn between rows. */
export function InfoRow({
  label,
  value,
  icon,
  valueStyle,
  last,
}: {
  label: string;
  value: React.ReactNode;
  icon?: IconName;
  valueStyle?: StyleProp<TextStyle>;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowDivider]}>
      <View style={styles.infoLabelWrap}>
        {icon ? <Icon name={icon} size={15} color={ui.textTertiary} /> : null}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      {typeof value === "string" || typeof value === "number" ? (
        <Text style={[styles.infoValue, valueStyle]} numberOfLines={2}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/* ─── Buttons ───────────────────────────────────────────────────────────── */

type ButtonVariant = "primary" | "secondary" | "tonal" | "destructive" | "plain";

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: "lg" | "md" | "sm";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = BUTTON_VARIANTS[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        BUTTON_SIZES[size],
        { backgroundColor: pressed ? v.pressed : v.bg, borderColor: v.border },
        isDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={size === "sm" ? 14 : 17} color={v.fg} weight="semibold" /> : null}
          <Text style={[size === "sm" ? styles.buttonTextSm : styles.buttonText, { color: v.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const BUTTON_VARIANTS: Record<ButtonVariant, { bg: string; pressed: string; fg: string; border: string }> = {
  primary: { bg: ui.brand, pressed: ui.brandPressed, fg: ui.onBrand, border: "transparent" },
  secondary: { bg: ui.surface, pressed: ui.surfaceMuted, fg: ui.text, border: ui.separator },
  tonal: { bg: ui.brandSoft, pressed: "#D7E5DD", fg: ui.brand, border: "transparent" },
  destructive: { bg: ui.dangerSoft, pressed: "#F8DCD7", fg: ui.danger, border: "transparent" },
  plain: { bg: "transparent", pressed: ui.surfaceMuted, fg: ui.brand, border: "transparent" },
};

const BUTTON_SIZES = StyleSheet.create({
  lg: { minHeight: 50, paddingHorizontal: 20, borderRadius: radii.md },
  md: { minHeight: 42, paddingHorizontal: 16, borderRadius: 10 },
  sm: { minHeight: 32, paddingHorizontal: 12, borderRadius: radii.sm },
});

/* ─── Status ────────────────────────────────────────────────────────────── */

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const BADGE_TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: ui.surfaceMuted, fg: ui.textSecondary },
  brand: { bg: ui.brandSoft, fg: ui.brand },
  success: { bg: ui.successSoft, fg: ui.success },
  warning: { bg: ui.warningSoft, fg: ui.warning },
  danger: { bg: ui.dangerSoft, fg: ui.danger },
  info: { bg: ui.infoSoft, fg: ui.info },
};

export function Badge({ label, tone = "neutral", dot }: { label: string; tone?: BadgeTone; dot?: boolean }) {
  const t = BADGE_TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {dot ? <View style={[styles.badgeDot, { backgroundColor: t.fg }]} /> : null}
      <Text style={[styles.badgeText, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Inline message strip for errors, warnings and offline state. */
export function Banner({
  tone = "danger",
  icon,
  title,
  message,
  actionLabel,
  onAction,
  style,
}: {
  tone?: "danger" | "warning" | "info" | "brand";
  icon?: IconName;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = BADGE_TONES[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }, style]}>
      <Icon name={icon ?? (tone === "danger" || tone === "warning" ? "alert" : "info")} size={17} color={t.fg} />
      <View style={styles.bannerText}>
        {title ? <Text style={[styles.bannerTitle, { color: t.fg }]}>{title}</Text> : null}
        <Text style={[styles.bannerMessage, { color: title ? ui.textSecondary : t.fg }]}>{message}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} style={styles.bannerAction}>
          <Text style={[styles.bannerActionText, { color: t.fg }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ─── Empty & loading ───────────────────────────────────────────────────── */

export function EmptyState({
  title,
  subtitle,
  mascot = "sleeping",
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  mascot?: MascotExpression;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Image source={brandMascot[mascot]} style={styles.emptyMascot} resizeMode="contain" />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="md" style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={ui.brand} />
      {label ? <Text style={styles.loadingText}>{label}</Text> : null}
    </View>
  );
}

/** Today's date for header context lines, e.g. "Sun 19 Oct". */
export function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function formatTime(value?: string | Date | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** "STANDARD_KING" → "Standard king". */
export function humanize(value?: string | null) {
  if (!value) return "";
  const words = value.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Shared list spacing for FlatList contentContainerStyle. */
export const listContent: ViewStyle = { paddingHorizontal: gutter, paddingBottom: 32, gap: 12 };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.canvas },

  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: gutter,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerText: { flex: 1, minWidth: 0 },
  headerEyebrow: { ...type.footnote, color: ui.textSecondary, marginBottom: 2 },
  headerTitle: { ...type.largeTitle, color: ui.text },
  headerSubtitle: { ...type.subhead, color: ui.textSecondary, marginTop: 4 },
  headerRight: { paddingBottom: 4 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 2,
  },
  sectionTitle: { ...type.footnoteStrong, color: ui.textSecondary },

  card: {
    backgroundColor: ui.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.separator,
    padding: 16,
    overflow: "hidden",
  },
  cardPressed: { backgroundColor: "#FBFAF8" },
  cardAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
  },
  infoRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.separator },
  infoLabelWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel: { ...type.subhead, color: ui.textSecondary },
  infoValue: { ...type.subheadStrong, color: ui.text, flexShrink: 1, textAlign: "right" },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: ui.separator },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...type.headline },
  buttonTextSm: { ...type.footnoteStrong },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { ...type.caption, fontWeight: "600" },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerText: { flex: 1 },
  bannerTitle: { ...type.footnoteStrong },
  bannerMessage: { ...type.footnote },
  bannerAction: { paddingHorizontal: 4 },
  bannerActionText: { ...type.footnoteStrong },

  empty: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 48 },
  emptyMascot: { width: 84, height: 84, marginBottom: 12 },
  emptyTitle: { ...type.headline, color: ui.text, textAlign: "center" },
  emptySubtitle: { ...type.subhead, color: ui.textSecondary, textAlign: "center", marginTop: 4, maxWidth: 300 },
  emptyAction: { marginTop: 16 },

  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  loadingText: { ...type.footnote, color: ui.textSecondary },
});
