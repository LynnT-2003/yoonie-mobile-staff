import React, { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { InboxVm } from "../viewModel/inboxPageVm";
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
import { gutter, radii, type, ui } from "../../../constants/theme";

interface InboxViewProps {
  vm: InboxVm;
}

/** Strictly strip all emoji characters from notification text */
function stripEmoji(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    )
    .replace(/[\u{1F300}-\u{1FAFF}\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getNotificationVisuals(item: StaffNotification) {
  const severity = (item.severity || "").toUpperCase();
  const type = (item.type || "").toUpperCase();

  if (severity === "CRITICAL") {
    return {
      icon: "alert" as const,
      color: ui.danger,
      bg: ui.dangerSoft,
      tag: item.data?.roomNumber ? `ROOM ${item.data.roomNumber} · CRITICAL` : "CRITICAL ALERT",
      accent: ui.danger,
    };
  }
  if (severity === "WARN") {
    return {
      icon: "alert" as const,
      color: ui.warning,
      bg: ui.warningSoft,
      tag: item.data?.roomNumber ? `ROOM ${item.data.roomNumber} · WARNING` : "WARNING",
      accent: ui.warning,
    };
  }
  if (type === "ROOM_DIRTY" || type.includes("ROOM")) {
    return {
      icon: "rooms" as const,
      color: ui.brand,
      bg: ui.brandSoft,
      tag: item.data?.roomNumber ? `ROOM ${item.data.roomNumber} · HOUSEKEEPING` : "HOUSEKEEPING",
      accent: undefined,
    };
  }
  if (type === "TASK_ASSIGNED" || type.includes("DISPATCH")) {
    return {
      icon: "dispatch" as const,
      color: ui.info,
      bg: ui.infoSoft,
      tag: "DISPATCH",
      accent: undefined,
    };
  }
  if (type === "PICKUP_READY" || type.includes("PICKUP")) {
    return {
      icon: "pickups" as const,
      color: ui.brand,
      bg: ui.brandSoft,
      tag: "PICKUP",
      accent: undefined,
    };
  }
  return {
    icon: "bell" as const,
    color: ui.textSecondary,
    bg: ui.surfaceMuted,
    tag: "NOTIFICATION",
    accent: undefined,
  };
}

export const InboxView: React.FC<InboxViewProps> = ({ vm }) => {
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const filteredItems = useMemo(() => {
    if (filter === "UNREAD") {
      return vm.items.filter((item) => !item.readAt && !item.ackedAt);
    }
    return vm.items;
  }, [vm.items, filter]);

  const renderItem = ({ item }: { item: StaffNotification }) => {
    const isBusy = vm.activeAckId === item.id;
    const isAcked = Boolean(item.ackedAt);
    const visuals = getNotificationVisuals(item);
    const hasRoomLink = Boolean(item.data?.roomNumber || item.type === "ROOM_DIRTY");
    const cleanTitle = stripEmoji(item.title);
    const cleanBody = stripEmoji(item.body);

    return (
      <Card accent={visuals.accent} style={[styles.card, !isAcked && styles.cardUnread]}>
        <View style={styles.cardInner}>
          {/* Header Row: Squircle Icon + Category Tag + Time */}
          <View style={styles.headerRow}>
            <View style={[styles.iconBox, { backgroundColor: visuals.bg }]}>
              <Icon name={visuals.icon} size={18} color={visuals.color} weight="semibold" />
            </View>

            <View style={styles.headerMeta}>
              <View style={styles.tagWrap}>
                {!isAcked ? <View style={styles.unreadDot} /> : null}
                <Text style={[styles.tagText, visuals.accent ? { color: visuals.color, fontWeight: "700" } : null]}>
                  {visuals.tag}
                </Text>
              </View>
              <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>

          {/* Title: zero emojis, full multi-line context without truncation */}
          <Text style={[styles.title, !isAcked && styles.titleUnread]}>
            {cleanTitle}
          </Text>

          {/* Body: zero emojis, full multi-line context without truncation */}
          {cleanBody ? (
            <Text style={styles.body}>
              {cleanBody}
            </Text>
          ) : null}

          {/* Actions: Full-width Acknowledge and Room buttons */}
          <View style={styles.actionArea}>
            {hasRoomLink ? (
              <Button
                size="md"
                variant="secondary"
                icon="rooms"
                label={item.data?.roomNumber ? `Go to Room ${item.data.roomNumber}` : "Open rooms"}
                onPress={() => router.push("/(app)/housekeeper")}
                style={styles.roomLinkButton}
              />
            ) : null}

            {isAcked ? (
              <View style={styles.ackedRow}>
                <Icon name="checkCircle" size={15} color={ui.success} />
                <Text style={styles.ackedText}>
                  {typeof item.ackedAt === "string" ? `Acknowledged at ${formatTime(item.ackedAt)}` : "Acknowledged"}
                </Text>
              </View>
            ) : (
              <Button
                size="md"
                variant="tonal"
                icon="check"
                label="Acknowledge"
                onPress={() => vm.acknowledge(item)}
                loading={isBusy}
                style={styles.fullWidthButton}
              />
            )}
          </View>
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

      {/* Segmented Filter Bar: All / Unread */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          onPress={() => setFilter("ALL")}
          style={[styles.filterTab, filter === "ALL" && styles.filterTabActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterText, filter === "ALL" && styles.filterTextActive]}>
            All ({vm.items.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter("UNREAD")}
          style={[styles.filterTab, filter === "UNREAD" && styles.filterTabActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterText, filter === "UNREAD" && styles.filterTextActive]}>
            Unread ({vm.unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      <OfflineSyncBanner />

      {vm.errorMessage ? (
        <Banner message={vm.errorMessage} actionLabel="Retry" onAction={vm.retryFetch} style={styles.banner} />
      ) : null}

      {vm.isLoading ? (
        <LoadingState label="Loading messages" />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => `${item.id || (item as any)._id || "notif"}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={[listContent, styles.listGap]}
          refreshControl={
            <RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.onRefresh} tintColor={ui.brand} />
          }
          ListEmptyComponent={
            <EmptyState
              mascot={filter === "UNREAD" ? "happy" : "calm"}
              title={filter === "UNREAD" ? "All caught up" : "No messages"}
              subtitle={
                filter === "UNREAD"
                  ? "You have acknowledged all active shift alerts."
                  : "New dispatch alerts and room updates will appear here."
              }
            />
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  banner: { marginHorizontal: gutter, marginBottom: 12 },
  filterBar: {
    flexDirection: "row",
    marginHorizontal: gutter,
    marginBottom: 12,
    backgroundColor: ui.surfaceMuted,
    padding: 3,
    borderRadius: radii.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.sm,
  },
  filterTabActive: {
    backgroundColor: ui.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    ...type.footnote,
    color: ui.textSecondary,
    fontWeight: "500",
  },
  filterTextActive: {
    color: ui.text,
    fontWeight: "600",
  },
  listGap: { gap: 12 },
  card: {
    padding: 0,
    backgroundColor: ui.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.separator,
    overflow: "hidden",
  },
  cardUnread: {
    borderColor: ui.separator,
    backgroundColor: "#FCFBF9",
  },
  cardInner: {
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerMeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tagWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ui.brand,
    flexShrink: 0,
  },
  tagText: {
    ...type.caption,
    ...type.mono,
    color: ui.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  timeText: {
    ...type.footnote,
    ...type.mono,
    color: ui.textTertiary,
    flexShrink: 0,
  },
  title: {
    ...type.headline,
    color: ui.text,
    lineHeight: 22,
  },
  titleUnread: {
    fontWeight: "700",
  },
  body: {
    ...type.subhead,
    color: ui.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  actionArea: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.separator,
  },
  fullWidthButton: {
    width: "100%",
  },
  roomLinkButton: {
    width: "100%",
    marginBottom: 8,
  },
  ackedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: ui.successSoft,
    borderRadius: radii.sm,
    width: "100%",
  },
  ackedText: {
    ...type.footnoteStrong,
    color: ui.success,
  },
});
