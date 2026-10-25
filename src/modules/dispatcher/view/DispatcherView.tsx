import React from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { DispatcherVm } from "../viewModel/dispatcherPageVm";
import { StatusChip } from "../../../components/common/StatusChip";
import { OfflineSyncBanner } from "../../../components/common/OfflineSyncBanner";
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  InfoRow,
  LoadingState,
  Screen,
  ScreenHeader,
  humanize,
  listContent,
  todayLabel,
} from "../../../components/ui";
import { DispatchStatus, DispatchTaskItem, DispatchType, Severity } from "../../../lib/types";
import { gutter, radii, type, ui } from "../../../constants/theme";

interface DispatcherViewProps {
  vm: DispatcherVm;
}

const FILTERS: { label: string; value: DispatchType | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Housekeeping", value: DispatchType.HOUSEKEEPING_TURNAROUND },
  { label: "Pickups", value: DispatchType.AIRPORT_PICKUP },
  { label: "Tours", value: DispatchType.TOUR_CONSOLIDATION },
];

const TYPE_LABELS: Record<string, string> = {
  [DispatchType.HOUSEKEEPING_TURNAROUND]: "Housekeeping",
  [DispatchType.AIRPORT_PICKUP]: "Airport pickup",
  [DispatchType.TOUR_CONSOLIDATION]: "Tour",
};

const ISSUE_LABEL: Record<string, string> = {
  FLIGHT_DELAYED: "flight delayed",
  GUEST_NOT_FOUND: "can't find the guest",
  VEHICLE_PROBLEM: "vehicle problem",
  OTHER: "needs help",
};

/** Where a pickup is, in the driver's words: the driver reports these from their phone. */
function pickupLine(item: DispatchTaskItem) {
  const p = item.pickup;
  if (!p) return null;
  const driver = item.assigneeName ?? "Driver";
  if (!item.assigneeUserId) return "No driver yet — assign one on the web";
  const stage =
    p.stage ??
    (item.status === DispatchStatus.DONE ? "DROPPED_OFF" : item.status === DispatchStatus.IN_PROGRESS ? "EN_ROUTE" : "ASSIGNED");
  switch (stage) {
    case "ASSIGNED":
      return `Waiting for ${driver} to accept`;
    case "CONFIRMED":
      return `${driver} accepted`;
    case "EN_ROUTE":
      return `${driver} is driving to the airport`;
    case "AT_AIRPORT":
      return `${driver} is waiting at ${p.meetingDoor ? `door ${p.meetingDoor}` : "arrivals"}`;
    case "GUEST_ON_BOARD":
      return `${p.guestName} is in the car`;
    case "DROPPED_OFF":
      return `${p.guestName} is at the lobby`;
  }
}

const isOpenTask = (item: DispatchTaskItem) =>
  item.status !== DispatchStatus.DONE && item.status !== DispatchStatus.DISMISSED;

export const DispatcherView: React.FC<DispatcherViewProps> = ({ vm }) => {
  const stats = [
    { label: "Open", value: vm.stats.open, color: ui.warning },
    { label: "Active", value: vm.stats.inProgress, color: ui.brand },
    { label: "Done", value: vm.stats.done, color: ui.success },
    { label: "Total", value: vm.stats.total, color: ui.text },
  ];

  const renderItem = ({ item }: { item: DispatchTaskItem }) => {
    const isBusy = vm.activeTaskId === item._id;
    const isCritical = item.severity === Severity.CRITICAL;
    const isWarn = item.severity === Severity.WARN;
    const issue = item.pickup?.issue && !item.pickup.issue.resolvedAt ? item.pickup.issue : undefined;
    const isRoom = item.type === DispatchType.HOUSEKEEPING_TURNAROUND;
    const isTour = item.type === DispatchType.TOUR_CONSOLIDATION;

    return (
      <Card accent={isCritical ? ui.danger : isWarn ? ui.warning : undefined}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.meta}>
              {TYPE_LABELS[item.type] ?? humanize(item.type)} · Priority {item.priorityScore}
            </Text>
          </View>
          <StatusChip status={isRoom && item.cleaningStatus ? item.cleaningStatus : item.status} />
        </View>

        {isCritical || isWarn ? (
          <View style={styles.severity}>
            <Badge
              label={isCritical ? "Critical" : "Needs attention"}
              tone={isCritical ? "danger" : "warning"}
              dot
            />
          </View>
        ) : null}

        {item.housekeeping || item.pickup ? (
          <View style={styles.rows}>
            {item.housekeeping ? (
              <InfoRow
                icon="rooms"
                label={`Room ${item.housekeeping.roomNumber}`}
                value={item.housekeeping.guestName || "Arrival"}
                last={!item.pickup}
              />
            ) : null}
            {item.pickup ? (
              <InfoRow
                icon="plane"
                label={item.pickup.flightNumber}
                value={item.pickup.guestName}
                last
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.spacer} />
        )}

        {item.pickup && isOpenTask(item) ? (
          <Text style={styles.meta}>{pickupLine(item)}</Text>
        ) : null}

        {issue && isOpenTask(item) ? (
          <>
            <Badge
              label={`${item.assigneeName ?? "Driver"}: ${ISSUE_LABEL[issue.kind] ?? "needs help"}${issue.note ? ` — ${issue.note}` : ""}`}
              tone="danger"
              dot
            />
            <View style={styles.decisions}>
              <Button label="Keep waiting" variant="tonal" size="md" onPress={() => vm.answerIssue(item, "KEEP_WAITING")} loading={isBusy} />
              <Button label="No-show" variant="destructive" size="md" onPress={() => vm.answerIssue(item, "NO_SHOW")} />
            </View>
          </>
        ) : null}

        {isTour && isOpenTask(item) ? (
          <View style={styles.decisions}>
            <Button label="Keep" variant="tonal" size="md" onPress={() => vm.decideTour(item, "KEEP")} loading={isBusy} />
            <Button label="Merge" variant="tonal" size="md" onPress={() => vm.decideTour(item, "MERGE")} />
            {vm.canCancelTour ? (
              <Button label="Cancel" variant="tonal" size="md" onPress={() => vm.decideTour(item, "CANCEL")} />
            ) : null}
          </View>
        ) : null}

        {isRoom && isOpenTask(item) ? (
          <Text style={styles.meta}>
            {item.assigneeName ? `${item.assigneeName} has this room` : "Open to any housekeeper"} · updates as they clean
          </Text>
        ) : null}
      </Card>
    );
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow={`BKK Riverside · ${todayLabel()}`}
        title="Dispatch"
        subtitle={vm.isLoading ? undefined : `${vm.stats.open} open · ${vm.stats.inProgress} in progress`}
      />

      <View style={styles.stats}>
        {stats.map((s, i) => (
          <View key={s.label} style={[styles.stat, i > 0 && styles.statDivider]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersScroll}
      >
        {FILTERS.map((opt) => {
          const isActive = vm.filterType === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => vm.setFilterType(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <OfflineSyncBanner />

      {vm.errorMessage ? (
        <Banner
          message={vm.errorMessage}
          actionLabel="Retry"
          onAction={vm.retryFetch}
          style={styles.banner}
        />
      ) : null}

      {vm.isLoading ? (
        <LoadingState label="Loading today's tasks" />
      ) : (
        <FlatList
          data={vm.tasks}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={listContent}
          refreshControl={
            <RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.onRefresh} tintColor={ui.brand} />
          }
          ListEmptyComponent={
            <EmptyState title="All clear" subtitle="No tasks in this category right now." />
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  banner: { marginHorizontal: gutter, marginBottom: 12 },
  decisions: { flexDirection: "row", gap: 8 },
  stats: {
    flexDirection: "row",
    marginHorizontal: gutter,
    backgroundColor: ui.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.separator,
    paddingVertical: 12,
  },
  stat: { flex: 1, alignItems: "center" },
  statDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: ui.separator },
  statValue: { ...type.title2, ...type.mono },
  statLabel: { ...type.caption, color: ui.textSecondary, marginTop: 2 },
  filtersScroll: { flexGrow: 0 },
  filters: { paddingHorizontal: gutter, paddingVertical: 12, gap: 8 },
  filterChip: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.separator,
    backgroundColor: ui.surface,
    justifyContent: "center",
  },
  filterChipActive: { backgroundColor: ui.text, borderColor: ui.text },
  filterText: { ...type.footnoteStrong, color: ui.textSecondary },
  filterTextActive: { color: ui.surface },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitleWrap: { flex: 1 },
  taskTitle: { ...type.headline, color: ui.text },
  meta: { ...type.footnote, color: ui.textSecondary, marginTop: 2 },
  severity: { marginTop: 10 },
  rows: { marginTop: 8, marginBottom: 14 },
  spacer: { height: 14 },
});
