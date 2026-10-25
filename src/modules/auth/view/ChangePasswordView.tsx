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
import { ChangePasswordVm } from "../viewModel/changePasswordVm";
import { brandMascot } from "../../../constants/brandAssets";
import { colors, typography, touchTargets, spacing } from "../../../constants/theme";

interface ChangePasswordViewProps {
  vm: ChangePasswordVm;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({ vm }) => {
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
          <View style={styles.brandContainer}>
            <Image
              source={brandMascot.thinking}
              style={styles.mascotImage}
              resizeMode="contain"
            />
            <View style={styles.securityPill}>
              <Text style={styles.securityPillText}>CREDENTIAL UPDATE</Text>
            </View>
            <Text style={styles.brandTitle}>Password Change Required</Text>
            <Text style={styles.brandSubtitle}>
              Your frontline staff account requires a secure updated password before accessing operational shift tools.
            </Text>
            {vm.userEmail ? (
              <View style={styles.userBadge}>
                <Text style={styles.userBadgeText}>{vm.userEmail}</Text>
              </View>
            ) : null}
          </View>

          {vm.error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{vm.error}</Text>
            </View>
          ) : null}

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Current Temporary Password</Text>
              <TextInput
                style={styles.input}
                value={vm.currentPassword}
                onChangeText={vm.setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>New Password (min 8 characters)</Text>
              <TextInput
                style={styles.input}
                value={vm.newPassword}
                onChangeText={vm.setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={vm.confirmPassword}
                onChangeText={vm.setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, vm.isSubmitting && styles.submitButtonDisabled]}
              onPress={vm.handleChangePassword}
              disabled={vm.isSubmitting}
              activeOpacity={0.8}
            >
              {vm.isSubmitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.submitButtonText}>Update Password & Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={vm.handleSignOut}
              disabled={vm.isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Sign Out & Cancel</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  mascotImage: {
    width: 100,
    height: 100,
    marginBottom: spacing.sm,
  },
  securityPill: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondaryDark,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  securityPillText: {
    ...typography.micro,
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  brandTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: "center",
  },
  brandSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
  userBadge: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userBadgeText: {
    ...typography.captionBold,
    color: colors.primary,
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
  cancelButton: {
    minHeight: touchTargets.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    ...typography.captionBold,
    color: colors.textMuted,
  },
});
