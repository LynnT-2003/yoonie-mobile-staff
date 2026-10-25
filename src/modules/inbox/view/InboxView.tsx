import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { InboxVm } from "../viewModel/inboxPageVm";
import { StatusChip } from "../../../components/common/StatusChip";
import { OfflineSyncBanner } from "../../../components/common/OfflineSyncBanner";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  Icon,
  LoadingState,
  Screen,
  ScreenHeader,
  formatTime,
  listContent,
  todayLabel,
} from "../../../components/ui";
import { StaffNotification } from "../../../lib/types";
import { gutter, type, ui } from "../../../constants/theme";

interface InboxViewProps {
  vm: InboxVm;
}

const SEVERITY_ACCENT: Record<string, string | undefined> = {
  CRITICAL: ui.danger,
  WARN: ui.warning,
};

export const InboxView: React.FC<InboxViewProps> = ({ vm }) => {
  const renderItem = ({ item }: { item: StaffNotification }) => {
    const isBusy = vm.activeAckId === item.id;
    const isAcked = Boolean(item.ackedAt);
    const severity = (item.severity || "").toUpperCase();
    const isFlagged = severity === "CRITICAL" || severity === "WARN";

    return (
      <Card accent={SEVERITY_ACCENT[severity]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleWrap}>
            {!isAcked ? <View style={styles.unreadDot} /> : null}
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>

        {isFlagged ? (
          <View style={styles.chipRow}>
            <StatusChip status={severity} />
          </View>
        ) : null}

        <Text style={styles.body}>{item.body}</Text>

        <View style={styles.footer}>
          {item.data?.roomNumber || item.type === "ROOM_DIRTY" ? (
            <View style={{ marginBottom: 8 }}>
              <Button
                size="md"
                variant="primary"
                label={item.data?.roomNumber ? `Go to room ${item.data.roomNumber}` : "Open my rooms"}
                onPress={() => router.push("/(app)/housekeeper")}
              />
            </View>
          ) : null}

          {isAcked ? (
            <View style={styles.ackedRow}>
              <Icon name="checkCircle" size={15} color={ui.success} />
              <Text style={styles.ackedText}>
                {typeof item.ackedAt === "string"
                  ? `Acknowledged at ${formatTime(item.ackedAt)}`
                  : "Acknowledged"}
              </Text>
            </View>
          ) : (
            <Button
              size="md"
              variant="tonal"
              label="Acknowledge Alert"
              onPress={() => vm.acknowledge(item)}
              loading={isBusy}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow={`BKK Riverside · ${todayLabel()}`}
        title="Inbox"
        subtitle={vm.isLoading ? undefined : vm.unreadCount > 0 ? `${vm.unreadCount} unread` : "No unread messages"}
      />

      <OfflineSyncBanner />

      {vm.errorMessage ? (
        <Banner message={vm.errorMessage} actionLabel="Retry" onAction={vm.retryFetch} style={styles.banner} />
      ) : null}

      {vm.isLoading ? (
        <LoadingState label="Loading messages" />
      ) : (
        <FlatList
          data={vm.items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={listContent}
          refreshControl={
            <RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.onRefresh} tintColor={ui.brand} />
          }
          ListEmptyComponent={
            <EmptyState
              mascot="calm"
              title="You're all caught up"
              subtitle="New alerts and dispatch messages for your shift will appear here."
            />
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  banner: { marginHorizontal: gutter, marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ui.brand },
  title: { ...type.headline, color: ui.text, flexShrink: 1 },
  time: { ...type.footnote, ...type.mono, color: ui.textTertiary, paddingTop: 2 },
  chipRow: { marginTop: 8 },
  body: { ...type.subhead, color: ui.textSecondary, marginTop: 6 },
  footer: { marginTop: 14 },
  ackedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ackedText: { ...type.footnote, color: ui.textSecondary },
});
