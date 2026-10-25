import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from "react-native";
import { WrongRoleVm } from "../viewModel/wrongRoleVm";
import { brandMascot } from "../../../constants/brandAssets";
import { colors, typography, touchTargets, spacing } from "../../../constants/theme";

interface WrongRoleViewProps {
  vm: WrongRoleVm;
}

export const WrongRoleView: React.FC<WrongRoleViewProps> = ({ vm }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.badgeContainer}>
          <Image
            source={brandMascot.worried}
            style={styles.mascotImage}
            resizeMode="contain"
          />
          <View style={styles.unauthorizedPill}>
            <Text style={styles.unauthorizedPillText}>ROLE RESTRICTED</Text>
          </View>
          <Text style={styles.title}>Unauthorized Staff Role</Text>
          <Text style={styles.subtitle}>
            This operational portal is reserved for Yoonie Property Frontline Staff
            (Housekeepers, Drivers, Dispatchers, and Managers).
          </Text>
        </View>

        {vm.statusMessage ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{vm.statusMessage}</Text>
          </View>
        ) : null}

        <View style={styles.profileCard}>
          <Text style={styles.cardHeader}>Signed In Account</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>User Name</Text>
            <Text style={styles.detailValue}>{vm.displayName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{vm.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned Role</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{vm.role}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Job Title</Text>
            <Text style={styles.detailValue}>{vm.jobTitle}</Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={vm.handleCheckPermissions}
            disabled={vm.isChecking}
            activeOpacity={0.8}
          >
            {vm.isChecking ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.refreshButtonText}>Re-check Staff Permissions</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={vm.handleSignOut}
            activeOpacity={0.8}
          >
            <Text style={styles.signOutButtonText}>Sign Out & Switch Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  badgeContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  mascotImage: {
    width: 110,
    height: 110,
    marginBottom: spacing.md,
  },
  unauthorizedPill: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
  unauthorizedPillText: {
    ...typography.micro,
    color: colors.danger,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: spacing.md,
  },
  statusBox: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.secondaryDark,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statusText: {
    ...typography.captionBold,
    color: colors.primary,
    textAlign: "center",
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  cardHeader: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  detailLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  roleTag: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: {
    ...typography.micro,
    color: colors.danger,
    fontWeight: "700",
  },
  actionContainer: {
    gap: spacing.md,
  },
  refreshButton: {
    minHeight: touchTargets.buttonHeight,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: "700",
  },
  signOutButton: {
    minHeight: touchTargets.buttonHeight,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutButtonText: {
    ...typography.bodyMedium,
    color: colors.textInverse,
    fontWeight: "700",
  },
});
