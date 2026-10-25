import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { LoginVm } from "../viewModel/loginPageVm";
import { brandMascot } from "../../../constants/brandAssets";
import { colors, typography, touchTargets, spacing } from "../../../constants/theme";

interface LoginViewProps {
  vm: LoginVm;
}

export const LoginView: React.FC<LoginViewProps> = ({ vm }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Yoonie Calm Mascot & Wordmark */}
          <View style={styles.brandContainer}>
            <Image
              source={brandMascot.calm}
              style={styles.mascotLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandWordmark}>yoonie</Text>
            <Text style={styles.brandTagline}>every booking, closed.</Text>
            <View style={styles.systemBadge}>
              <Text style={styles.systemBadgeText}>STAFF OS</Text>
            </View>
            <Text style={styles.brandSubtitle}>
              Frontline Operations, Housekeeping & Logistics
            </Text>
          </View>

          {/* Error message */}
          {vm.error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{vm.error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Staff Authentication</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Staff Email</Text>
              <TextInput
                style={styles.input}
                value={vm.email}
                onChangeText={vm.setEmail}
                placeholder="staff@riverside-bkk.example"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={vm.password}
                onChangeText={vm.setPassword}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, vm.isSubmitting && styles.submitButtonDisabled]}
              onPress={vm.handleLogin}
              disabled={vm.isSubmitting}
              activeOpacity={0.8}
            >
              {vm.isSubmitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.submitButtonText}>Sign In to Shift</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Seeded Staff User Quick Switcher (DEV ONLY) */}
          {vm.isDevMode && vm.presets.length > 0 ? (
            <View style={styles.presetsCard}>
              <View style={styles.devBannerBadge}>
                <Text style={styles.devBannerText}>DEVELOPMENT PRESETS</Text>
              </View>
              <Text style={styles.presetsHeader}>Quick Select Seeded Staff User</Text>
              <Text style={styles.presetsSubheader}>
                Tap a frontline team member to test role-specific workflows
              </Text>

              <View style={styles.presetList}>
                {vm.presets.map((preset) => {
                  const isSelected =
                    vm.email.toLowerCase() === preset.email.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={preset.email}
                      style={[
                        styles.presetItem,
                        isSelected && styles.presetItemSelected,
                      ]}
                      onPress={() => vm.selectPreset(preset)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.presetTextRow}>
                        <Text style={styles.presetName}>{preset.name}</Text>
                        <View style={styles.roleChip}>
                          <Text style={styles.roleChipText}>{preset.jobTitle}</Text>
                        </View>
                      </View>
                      <Text style={styles.presetEmail}>{preset.email}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  mascotLogo: {
    width: 100,
    height: 100,
    marginBottom: spacing.sm,
  },
  brandWordmark: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -1.5,
    fontFamily: Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium",
  },
  brandTagline: {
    ...typography.captionBold,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontSize: 11,
    marginTop: 2,
  },
  systemBadge: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondaryDark,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: spacing.sm,
  },
  systemBadgeText: {
    ...typography.micro,
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 1,
  },
  brandSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.captionBold,
    color: colors.danger,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: touchTargets.inputHeight,
    backgroundColor: colors.cardSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  submitButton: {
    minHeight: touchTargets.buttonHeight,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.h3,
    color: colors.textInverse,
    fontWeight: "700",
  },
  presetsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  devBannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.amberLight,
    borderColor: colors.amber,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  devBannerText: {
    ...typography.micro,
    color: "#B45309",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  presetsHeader: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  presetsSubheader: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  presetList: {
    gap: spacing.sm,
  },
  presetItem: {
    minHeight: touchTargets.minHeight,
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.cardSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  presetItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  presetTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  presetName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  roleChip: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.secondaryDark,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleChipText: {
    ...typography.micro,
    color: colors.primary,
    fontWeight: "700",
  },
  presetEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
