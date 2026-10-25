import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { ProfileVm } from "../viewModel/profilePageVm";
import {
  Badge,
  Button,
  Card,
  Icon,
  InfoRow,
  Screen,
  ScreenHeader,
  SectionHeader,
  humanize,
} from "../../../components/ui";
import { gutter, radii, type, ui } from "../../../constants/theme";

interface ProfileViewProps {
  vm: ProfileVm;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "S";
}

export const ProfileView: React.FC<ProfileViewProps> = ({ vm }) => {
  const user = vm.currentUser;
  const name = user?.displayName || "Staff member";
  const roleLabel = humanize(user?.jobTitle || user?.role || "Staff");

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Profile" />

        <View style={styles.body}>
          {/* Identity */}
          <Card style={styles.identityCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(name)}</Text>
            </View>
            <View style={styles.identityText}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.role}>{roleLabel} · BKK Riverside</Text>
            </View>
          </Card>

          {/* Account */}
          <SectionHeader title="Account" />
          <Card style={styles.groupCard}>
            <InfoRow
              label="Email"
              value={typeof user?.email === "string" ? user.email : "—"}
            />
            <InfoRow label="Role" value={roleLabel} />
            <InfoRow label="Branch" value="BKK Riverside Boutique Hotel" />
            <InfoRow
              label="Connection"
              value={<Badge label={vm.isOnline ? "Online" : "Offline"} tone={vm.isOnline ? "success" : "warning"} dot />}
              last
            />
          </Card>

          {/* Notifications */}
          <SectionHeader title="Notifications" />
          <Card style={styles.groupCard}>
            <View style={[styles.row, styles.rowDivider]}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Push notifications</Text>
                <Text style={styles.rowHint}>{vm.pushStatusMessage}</Text>
              </View>
              <Switch
                value={vm.notificationsEnabled}
                onValueChange={vm.toggleNotifications}
                trackColor={{ false: ui.separator, true: ui.brand }}
                thumbColor={ui.surface}
                ios_backgroundColor={ui.separator}
              />
            </View>

            <Pressable
              onPress={vm.connectLine}
              disabled={vm.isLinkingLine}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              accessibilityRole="button"
            >
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Connect LINE</Text>
                <Text style={styles.rowHint}>Get shift alerts and VIP arrivals in LINE chat.</Text>
              </View>
              {vm.isLinkingLine ? (
                <ActivityIndicator color={ui.brand} />
              ) : (
                <Icon name="chevronRight" size={14} color={ui.textTertiary} weight="semibold" />
              )}
            </Pressable>

            {vm.lineTokenInfo ? (
              <View style={styles.linkInfo}>
                <Text style={styles.linkInfoText} selectable>
                  {vm.lineTokenInfo}
                </Text>
              </View>
            ) : null}
          </Card>

          <Button
            variant="destructive"
            icon="logout"
            label="Sign out"
            onPress={vm.handleLogout}
            loading={vm.isLoggingOut}
            style={styles.signOut}
          />
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  body: { paddingHorizontal: gutter, gap: 8 },
  identityCard: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 8 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ui.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...type.title3, color: ui.brand },
  identityText: { flex: 1, minWidth: 0 },
  name: { ...type.title3, color: ui.text },
  role: { ...type.footnote, color: ui.textSecondary, marginTop: 2 },
  groupCard: { paddingVertical: 0, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    minHeight: 52,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.separator },
  rowPressed: { opacity: 0.6 },
  rowText: { flex: 1 },
  rowLabel: { ...type.body, color: ui.text },
  rowHint: { ...type.footnote, color: ui.textSecondary, marginTop: 2 },
  linkInfo: {
    backgroundColor: ui.surfaceMuted,
    borderRadius: radii.sm,
    padding: 12,
    marginBottom: 12,
  },
  linkInfoText: { ...type.footnote, color: ui.text },
  signOut: { marginTop: 16 },
});
