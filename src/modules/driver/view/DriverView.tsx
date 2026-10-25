import React from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { DriverVm, PICKUP_STAGE_ORDER, nextPickupStage, pickupStage } from "../viewModel/driverPageVm";
import { StatusChip } from "../../../components/common/StatusChip";
import { OfflineSyncBanner } from "../../../components/common/OfflineSyncBanner";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  InfoRow,
  LoadingState,
  Screen,
  ScreenHeader,
  formatTime,
  listContent,
  todayLabel,
} from "../../../components/ui";
import { PickupIssueKind, PickupStage, PickupTaskDto } from "../../../lib/types";
import { gutter, radii, type, ui } from "../../../constants/theme";

/** What the driver taps to report each next step. */
const NEXT_LABEL: Record<PickupStage, (t: PickupTaskDto) => string> = {
  ASSIGNED: () => "Accept pickup",
  CONFIRMED: () => "Leaving for the airport",
  EN_ROUTE: (t) => (t.meetingDoor ? `At arrivals, door ${t.meetingDoor}` : "At arrivals"),
  AT_AIRPORT: () => "Guest is with me",
  GUEST_ON_BOARD: () => "Dropped at the hotel",
  DROPPED_OFF: () => "",
};

const STEP_LABEL: Record<PickupStage, string> = {
  ASSIGNED: "Assigned",
  CONFIRMED: "Accepted",
  EN_ROUTE: "Left the hotel",
  AT_AIRPORT: "At the arrivals door",
  GUEST_ON_BOARD: "Guest on board",
  DROPPED_OFF: "At the lobby",
};

const ISSUE_LABEL: Record<PickupIssueKind, string> = {
  FLIGHT_DELAYED: "Flight delayed",
  GUEST_NOT_FOUND: "Can't find the guest",
  VEHICLE_PROBLEM: "Vehicle problem",
  OTHER: "Need help",
};

interface DriverViewProps {
  vm: DriverVm;
}

export const DriverView: React.FC<DriverViewProps> = ({ vm }) => {
  const remaining = vm.tasks.filter((t) => pickupStage(t) !== "DROPPED_OFF").length;

  const askProblem = (item: PickupTaskDto) =>
    Alert.alert("What's wrong?", "The desk is alerted right away.", [
      ...(["FLIGHT_DELAYED", "GUEST_NOT_FOUND", "VEHICLE_PROBLEM"] as PickupIssueKind[]).map((kind) => ({
        text: ISSUE_LABEL[kind],
        onPress: () => void vm.reportIssue(item, kind),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);

  const renderItem = ({ item }: { item: PickupTaskDto }) => {
    const isBusy = vm.activeDispatchId === item.dispatchId;
    const stage = pickupStage(item);
    const next = nextPickupStage(item);
    const isDone = stage === "DROPPED_OFF";
    const current = PICKUP_STAGE_ORDER.indexOf(stage);
    const isInProgress = current >= PICKUP_STAGE_ORDER.indexOf("EN_ROUTE") && !isDone;

    return (
      <Card accent={isInProgress ? ui.brand : undefined}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.flightNumber}>{item.flightNumber}</Text>
            <Text style={styles.meta}>Lands {formatTime(item.etaAt)}</Text>
          </View>
          <StatusChip status={item.dispatchStatus} />
        </View>

        {/* the journey: what's been reported, with times */}
        <View style={styles.steps}>
          {PICKUP_STAGE_ORDER.slice(1).map((st) => {
            const idx = PICKUP_STAGE_ORDER.indexOf(st);
            const done = idx <= current;
            const at = [...(item.steps ?? [])].reverse().find((s) => s.stage === st)?.at;
            return (
              <View key={st} style={styles.stepRow}>
                <View style={[styles.stepDot, done ? styles.stepDotDone : null]} />
                <Text style={[styles.stepText, done ? styles.stepTextDone : null]}>{STEP_LABEL[st]}</Text>
                <Text style={styles.stepTime}>{done && at ? formatTime(at) : ""}</Text>
              </View>
            );
          })}
        </View>

        {item.issue ? (
          <Banner
            message={`Desk alerted: ${ISSUE_LABEL[item.issue.kind]}. Wait for their reply in your inbox.`}
            style={styles.issue}
          />
        ) : null}

        <View style={styles.rows}>
          <InfoRow
            icon="person"
            label="Guest"
            value={item.guestName}
            last={!item.meetingDoor && !item.vehiclePlate}
          />
          {item.meetingDoor ? (
            <InfoRow
              icon="door"
              label="Meeting point"
              value={`Arrivals, door ${item.meetingDoor}`}
              last={!item.vehiclePlate}
            />
          ) : null}
          {item.vehiclePlate ? (
            <InfoRow icon="pickups" label="Vehicle" value={item.vehiclePlate} last />
          ) : null}
        </View>

        {item.card?.en ? (
          <View style={styles.sign}>
            <Text style={styles.signLabel}>Arrival sign</Text>
            <Text style={styles.signGuest}>{item.guestName}</Text>
            <Text style={styles.signEn}>{item.card.en}</Text>
            {item.card.th ? <Text style={styles.signTh}>{item.card.th}</Text> : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          {next ? (
            <Button
              label={NEXT_LABEL[stage](item)}
              icon={next === "DROPPED_OFF" || next === "CONFIRMED" ? "check" : undefined}
              onPress={() => vm.advance(item)}
              loading={isBusy}
            />
          ) : null}
          {isDone ? <Text style={styles.doneText}>Pickup completed</Text> : null}
          {!isDone ? (
            <Button
              label="Call guest"
              icon="phone"
              variant="secondary"
              onPress={() => vm.callGuest(item.guestPhone, item.guestName)}
            />
          ) : null}
          {!isDone && current >= PICKUP_STAGE_ORDER.indexOf("CONFIRMED") && !item.issue ? (
            <Button label="Report a problem" icon="alert" variant="destructive" onPress={() => askProblem(item)} />
          ) : null}
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow={`BKK Riverside · ${todayLabel()}`}
        title="Pickups"
        subtitle={
          vm.isLoading
            ? undefined
            : `${remaining} ${remaining === 1 ? "pickup" : "pickups"} remaining today`
        }
      />

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
        <LoadingState label="Loading your pickups" />
      ) : (
        <FlatList
          data={vm.tasks}
          keyExtractor={(item) => item.dispatchId}
          renderItem={renderItem}
          contentContainerStyle={listContent}
          refreshControl={
            <RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.onRefresh} tintColor={ui.brand} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No pickups scheduled"
              subtitle="You have no airport transfers assigned today."
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
  cardTitleWrap: { flex: 1 },
  flightNumber: { ...type.title3, ...type.mono, color: ui.text },
  meta: { ...type.footnote, color: ui.textSecondary, marginTop: 2 },
  rows: { marginTop: 8, marginBottom: 14 },
  sign: {
    backgroundColor: ui.surfaceMuted,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 14,
    gap: 4,
  },
  signLabel: { ...type.caption, color: ui.textSecondary },
  signGuest: { ...type.title2, color: ui.text },
  signEn: { ...type.subhead, color: ui.text },
  signTh: { ...type.subhead, color: ui.textSecondary },
  actions: { gap: 10 },
  steps: { marginTop: 12, gap: 6 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: ui.separator,
    backgroundColor: ui.surface,
  },
  stepDotDone: { borderColor: ui.brand, backgroundColor: ui.brand },
  stepText: { ...type.footnote, color: ui.textTertiary, flex: 1 },
  stepTextDone: { color: ui.text },
  stepTime: { ...type.footnote, color: ui.textSecondary, fontVariant: ["tabular-nums"] },
  issue: { marginBottom: 12 },
  doneText: {
    ...type.footnote,
    color: ui.success,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 4,
  },
});
