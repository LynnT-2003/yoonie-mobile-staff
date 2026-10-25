import React from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ManagerVm } from "../viewModel/managerPageVm";
import { StatusChip } from "../../../components/common/StatusChip";
import { OfflineSyncBanner } from "../../../components/common/OfflineSyncBanner";
import {
  Banner,
  Button,
  Card,
  EmptyState,
  LoadingState,
  Screen,
  ScreenHeader,
  humanize,
  listContent,
  todayLabel,
} from "../../../components/ui";
import { RoomItem } from "../../../lib/types";
import { gutter, radii, type, ui } from "../../../constants/theme";

interface ManagerViewProps {
  vm: ManagerVm;
}

export const ManagerView: React.FC<ManagerViewProps> = ({ vm }) => {
  const waiting = vm.rooms.length;

  const renderItem = ({ item }: { item: RoomItem }) => {
    const isBusy = vm.activeRoomId === item._id;
    const canInspect = vm.hasInspectPermission;

    return (
      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
            <Text style={styles.roomMeta}>
              Floor {item.floor} · {humanize(item.roomType)}
            </Text>
          </View>
          <StatusChip status="clean" customLabel="Ready for review" />
        </View>

        <Text style={styles.amenities} numberOfLines={2}>
          {item.amenities && item.amenities.length > 0
            ? item.amenities.map(humanize).join(" · ")
            : "Standard amenities"}
        </Text>

        <View style={styles.actionRow}>
          <Button
            label="Send back"
            variant="destructive"
            onPress={() => vm.openFailModal(item)}
            disabled={!canInspect || isBusy}
            style={styles.actionBtn}
          />
          <Button
            label="Approve"
            icon="check"
            onPress={() => vm.passInspection(item)}
            disabled={!canInspect}
            loading={isBusy}
            style={styles.actionBtn}
          />
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow={`BKK Riverside · ${todayLabel()}`}
        title="Inspect"
        subtitle={
          vm.isLoading
            ? undefined
            : waiting === 0
              ? "No rooms waiting for sign-off"
              : `${waiting} ${waiting === 1 ? "room" : "rooms"} waiting for sign-off`
        }
      />

      <OfflineSyncBanner />

      {!vm.isLoading && !vm.hasInspectPermission ? (
        <Banner
          tone="warning"
          title="View only"
          message="Your account can't approve or send back inspections. Ask an admin for inspection access."
          style={styles.banner}
        />
      ) : null}

      {vm.errorMessage ? (
        <Banner message={vm.errorMessage} actionLabel="Retry" onAction={vm.retryFetch} style={styles.banner} />
      ) : null}

      {vm.isLoading ? (
        <LoadingState label="Loading rooms for inspection" />
      ) : (
        <FlatList
          data={vm.rooms}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={listContent}
          refreshControl={
            <RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.onRefresh} tintColor={ui.brand} />
          }
          ListEmptyComponent={
            <EmptyState
              mascot="happy"
              title="All rooms inspected"
              subtitle="Every cleaned room has been signed off for check-in."
            />
          }
        />
      )}

      <Modal
        visible={Boolean(vm.failingRoom)}
        transparent
        animationType="fade"
        onRequestClose={vm.closeFailModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Send back room {vm.failingRoom?.roomNumber}</Text>
            <Text style={styles.modalSubtitle}>
              Tell housekeeping what needs fixing. The room will be marked dirty again.
            </Text>

            {vm.failError ? <Banner message={vm.failError} style={styles.modalBanner} /> : null}

            <TextInput
              style={styles.reasonInput}
              value={vm.failReason}
              onChangeText={vm.setFailReason}
              placeholder="e.g. Mirror smudged, replace hand towels"
              placeholderTextColor={ui.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.actionRow}>
              <Button label="Cancel" variant="secondary" onPress={vm.closeFailModal} style={styles.actionBtn} />
              <Button
                label="Send back"
                variant="destructive"
                onPress={vm.submitFailInspection}
                style={styles.actionBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  roomNumber: { ...type.title3, ...type.mono, color: ui.text },
  roomMeta: { ...type.footnote, color: ui.textSecondary, marginTop: 2 },
  amenities: { ...type.footnote, color: ui.textSecondary, marginTop: 12, marginBottom: 14 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: ui.overlay,
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: ui.surface,
    borderRadius: radii.lg,
    padding: 20,
  },
  modalTitle: { ...type.headline, color: ui.text },
  modalSubtitle: { ...type.subhead, color: ui.textSecondary, marginTop: 4, marginBottom: 16 },
  modalBanner: { marginBottom: 12 },
  reasonInput: {
    ...type.body,
    color: ui.text,
    minHeight: 96,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.separator,
    borderRadius: radii.md,
    backgroundColor: ui.surfaceMuted,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 16,
  },
});
