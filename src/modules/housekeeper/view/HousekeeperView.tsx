import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { HousekeeperVm } from "../viewModel/housekeeperPageVm";
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
  formatTime,
  humanize,
  listContent,
  todayLabel,
} from "../../../components/ui";
import { CleaningStatus, HousekeepingTask } from "../../../lib/types";
import { gutter, type, ui } from "../../../constants/theme";

interface HousekeeperViewProps {
  vm: HousekeeperVm;
}

export const HousekeeperView: React.FC<HousekeeperViewProps> = ({ vm }) => {
  const toTurn = vm.tasks.filter(
    (t) => t.cleaningStatus === CleaningStatus.DIRTY || t.cleaningStatus === CleaningStatus.IN_PROGRESS
  ).length;

  const renderItem = ({ item }: { item: HousekeepingTask }) => {
    const isBusy = vm.updatingRoomId === item.roomId;

    return (
      <Card accent={item.isVip ? ui.warning : undefined}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
            <Text style={styles.roomMeta}>
              Floor {item.floor} · {humanize(item.roomType)}
            </Text>
          </View>
          <StatusChip status={item.cleaningStatus} />
        </View>
        {item.isMine === false ? (
          <View style={styles.poolHint}>
            <Badge label="Unassigned · tap Start to take this room" tone="neutral" />
          </View>
        ) : null}

        <View style={styles.rows}>
          {item.guestName ? (
            <InfoRow
              icon="person"
              label="Arriving"
              value={
                <View style={styles.guestValue}>
                  <Text style={styles.guestName} numberOfLines={1}>
                    {item.guestName}
                  </Text>
                  {item.isVip ? <Badge label="VIP" tone="warning" /> : null}
                </View>
              }
            />
          ) : null}
          {item.flightNumber ? <InfoRow icon="plane" label="Flight" value={item.flightNumber} /> : null}
          <InfoRow
            icon="clock"
            label="Ready by"
            value={formatTime(item.targetReadyBy)}
            valueStyle={item.isVip ? styles.urgent : undefined}
            last
          />
        </View>

        {item.cleaningStatus === CleaningStatus.DIRTY ? (
          <Button
            label="Start cleaning"
            onPress={() => vm.updateRoomStatus(item, CleaningStatus.IN_PROGRESS)}
            loading={isBusy}
          />
        ) : null}

        {item.cleaningStatus === CleaningStatus.IN_PROGRESS ? (
          <Button
            label="Mark as clean"
            icon="check"
            onPress={() => vm.updateRoomStatus(item, CleaningStatus.CLEAN)}
            loading={isBusy}
          />
        ) : null}

        {item.cleaningStatus === CleaningStatus.CLEAN ? (
          <Text style={styles.footnote}>Waiting for manager inspection</Text>
        ) : null}

        {item.cleaningStatus === CleaningStatus.INSPECTED ? (
          <Text style={[styles.footnote, styles.footnoteSuccess]}>Inspected and ready for check-in</Text>
        ) : null}
      </Card>
    );
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow={`BKK Riverside · ${todayLabel()}`}
        title="Rooms"
        subtitle={
          vm.isLoading
            ? undefined
            : `${toTurn} to turn around · sorted by arrival and VIP priority`
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
        <LoadingState label="Loading your rooms" />
      ) : (
        <FlatList
          data={vm.tasks}
          keyExtractor={(item) => item.roomId}
          renderItem={renderItem}
          contentContainerStyle={listContent}
          refreshControl={
            <RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.onRefresh} tintColor={ui.brand} />
          }
          ListEmptyComponent={
            <EmptyState
              title="All rooms are turned around"
              subtitle="Nothing is assigned to your shift right now."
            />
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  poolHint: { marginBottom: 8 },
  banner: { marginHorizontal: gutter, marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitleWrap: { flex: 1 },
  roomNumber: { ...type.title3, ...type.mono, color: ui.text },
  roomMeta: { ...type.footnote, color: ui.textSecondary, marginTop: 2 },
  rows: { marginTop: 8, marginBottom: 14 },
  guestValue: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  guestName: { ...type.subheadStrong, color: ui.text, flexShrink: 1 },
  urgent: { color: ui.danger },
  footnote: { ...type.footnote, color: ui.textSecondary, textAlign: "center", paddingVertical: 4 },
  footnoteSuccess: { color: ui.success, fontWeight: "600" },
});
