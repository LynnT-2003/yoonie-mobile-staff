/**
 * Yoonie Brand Design System Tokens
 * Source: PRODUCT_GUIDELINES.md & yoonie-brand-assets
 *
 * ICONS & EMOJI:
 * Native platform icons only (SF Symbols on iOS, Material Symbols on Android/web)
 * via `components/ui/Icon`. Emoji are never used anywhere in the product.
 *
 * `colors` / `typography` below are kept for the auth screens. The signed-in app
 * shell uses the `ui`, `type` and `radii` tokens at the bottom of this file.
 */

export const colors = {
  // Brand Core Colors
  primary: "#28594E", // Forest Green: Primary brand color, headers, primary buttons
  primaryHover: "#1E453C",
  primaryLight: "#EAF1ED",
  secondary: "#D8E6DA", // Soft Sage: Secondary surface tint, badge backgrounds
  secondaryDark: "#A9C5B0",
  amber: "#E8A45B", // Honey Amber: VIP badges, attention, urgent warnings
  amberLight: "#FDF4E9",
  linen: "#F5EBDD", // Warm Linen: Primary canvas / neutral light
  linenDark: "#EADDCB",
  charcoal: "#303A36", // Charcoal: Primary typography / deep neutral

  // Canvas & Surfaces (Warm Linen & Crisp Cards)
  background: "#F5EBDD", // Warm Linen main page background
  card: "#FFFFFF",
  cardSubtle: "#FAF4EB", // Tinted Warm Linen for nested groups
  cardElevated: "#FFFFFF",
  sage: "#D8E6DA",

  // Typography (Charcoal & Muted Sage Grey)
  textPrimary: "#303A36", // Charcoal
  textSecondary: "#566660", // Medium Charcoal
  textMuted: "#7A8B84", // Muted Sage Grey
  textInverse: "#FFFFFF",

  // Borders & Dividers
  border: "#E2D8C9", // Warm Linen soft border
  borderSubtle: "#EDE4D8",
  borderFocus: "#28594E",
  borderSage: "#C2D6C6",

  // Extended Semantics
  success: "#236B56",
  successLight: "#D8E6DA",
  danger: "#D9534F",
  dangerLight: "#FDE8E8",
  warning: "#E8A45B",
  warningLight: "#FDF4E9",

  // Status Chips & Semantics (Always paired with clear text labels, ZERO icons)
  status: {
    clean: {
      text: "#236B56",
      bg: "#D8E6DA",
      border: "#A9C5B0",
      label: "CLEAN",
    },
    dirty: {
      text: "#D9534F",
      bg: "#FDE8E8",
      border: "#F8B4B4",
      label: "DIRTY",
    },
    inProgress: {
      text: "#28594E",
      bg: "#EAF1ED",
      border: "#A9C5B0",
      label: "IN PROGRESS",
    },
    inspected: {
      text: "#28594E",
      bg: "#D8E6DA",
      border: "#28594E",
      label: "INSPECTED",
    },
    open: {
      text: "#B45309",
      bg: "#FDF4E9",
      border: "#E8A45B",
      label: "OPEN",
    },
    done: {
      text: "#236B56",
      bg: "#D8E6DA",
      border: "#A9C5B0",
      label: "DONE",
    },
    acknowledged: {
      text: "#28594E",
      bg: "#D8E6DA",
      border: "#A9C5B0",
      label: "ACKNOWLEDGED",
    },
    critical: {
      text: "#D9534F",
      bg: "#FDE8E8",
      border: "#F8B4B4",
      label: "CRITICAL",
    },
    warn: {
      text: "#B45309",
      bg: "#FDF4E9",
      border: "#E8A45B",
      label: "WARN",
    },
    info: {
      text: "#28594E",
      bg: "#D8E6DA",
      border: "#A9C5B0",
      label: "INFO",
    },
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const touchTargets = {
  minHeight: 48,
  minWidth: 48,
  buttonHeight: 52,
  inputHeight: 52,
  chipHeight: 36,
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: "700" as const, lineHeight: 32, letterSpacing: -0.4 },
  h2: { fontSize: 20, fontWeight: "700" as const, lineHeight: 26, letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: "600" as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 21 },
  bodyMedium: { fontSize: 15, fontWeight: "500" as const, lineHeight: 21 },
  caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: "600" as const, lineHeight: 18 },
  micro: { fontSize: 11, fontWeight: "700" as const, lineHeight: 14, letterSpacing: 0.5 },
} as const;

/** Signed-in app shell: neutral grouped surfaces with forest green as the only brand colour. */
export const ui = {
  canvas: "#F6F4EF",
  surface: "#FFFFFF",
  surfaceMuted: "#F2EFE9",
  separator: "#E6E1D8",
  text: "#1F2A26",
  textSecondary: "#5F6B66",
  textTertiary: "#8D9893",
  brand: "#28594E",
  brandPressed: "#1E453C",
  brandSoft: "#E6EFEA",
  onBrand: "#FFFFFF",
  success: "#1F6B4F",
  successSoft: "#E3F1E8",
  warning: "#A35F12",
  warningSoft: "#FBF0E1",
  danger: "#C0392B",
  dangerSoft: "#FCEBE8",
  info: "#2E5A8C",
  infoSoft: "#E9F0F8",
  overlay: "rgba(20, 26, 24, 0.45)",
} as const;

/** iOS-style type ramp — sentence case everywhere, no all-caps micro labels. */
export const type = {
  largeTitle: { fontSize: 30, fontWeight: "700" as const, lineHeight: 36, letterSpacing: -0.5 },
  title2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28, letterSpacing: -0.3 },
  title3: { fontSize: 19, fontWeight: "600" as const, lineHeight: 24, letterSpacing: -0.2 },
  headline: { fontSize: 17, fontWeight: "600" as const, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  bodyStrong: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  subhead: { fontSize: 15, fontWeight: "400" as const, lineHeight: 20 },
  subheadStrong: { fontSize: 15, fontWeight: "600" as const, lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  footnoteStrong: { fontSize: 13, fontWeight: "600" as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16 },
  mono: { fontVariant: ["tabular-nums"] as ["tabular-nums"] },
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Horizontal page gutter used by every signed-in screen. */
export const gutter = 16;
