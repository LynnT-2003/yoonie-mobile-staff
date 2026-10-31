import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { HousekeeperVm } from "../viewModel/housekeeperPageVm";
import { StatusChip } from "../../../components/common/StatusChip";
import { OfflineSyncBanner } from "../../../components/common/OfflineSyncBanner";
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Icon,
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
import { gutter, radii, type, ui } from "../../../constants/theme";

interface HousekeeperViewProps {
  vm: HousekeeperVm;
}

type SortField = "priority" | "roomNumber" | "floor" | "status";
type SortDirection = "asc" | "desc";

const SORT_FIELDS: {
  key: SortField;
  label: string;
  ascHint: string;
  descHint: string;
}[] = [
  {
    key: "priority",
    label: "Priority (Ready by)",
    ascHint: "Earliest ready by first · VIP top",
    descHint: "Latest ready by first · VIP bottom",
  },
  {
    key: "roomNumber",
    label: "Room Number",
    ascHint: "101 → 999 (Lowest first)",
    descHint: "999 → 101 (Highest first)",
  },
  {
    key: "floor",
    label: "Floor",
    ascHint: "Floor 1 → 5 (Lowest first)",
    descHint: "Floor 5 → 1 (Highest first)",
  },
  {
    key: "status",
    label: "Cleaning Status",
    ascHint: "Dirty → In Progress → Clean",
    descHint: "Clean → In Progress → Dirty",
  },
];

export const HousekeeperView: React.FC<HousekeeperViewProps> = ({ vm }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showSortModal, setShowSortModal] = useState(false);

  const toTurn = vm.tasks.filter(
    (t) => t.cleaningStatus === CleaningStatus.DIRTY || t.cleaningStatus === CleaningStatus.IN_PROGRESS
  ).length;

  const floors = useMemo(() => {
    const set = new Set<number>();
    vm.tasks.forEach((t) => {
      if (typeof t.floor === "number") set.add(t.floor);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [vm.tasks]);

  const counts = useMemo(() => {
    let dirty = 0;
    let inProgress = 0;
    let clean = 0;
    let vip = 0;
    vm.tasks.forEach((t) => {
      if (t.cleaningStatus === CleaningStatus.DIRTY) dirty++;
      if (t.cleaningStatus === CleaningStatus.IN_PROGRESS) inProgress++;
      if (t.cleaningStatus === CleaningStatus.CLEAN || t.cleaningStatus === CleaningStatus.INSPECTED) clean++;
      if (t.isVip) vip++;
    });
    return { dirty, inProgress, clean, vip, total: vm.tasks.length };
  }, [vm.tasks]);

  const filterChips = useMemo(() => {
    const chips: { id: string; label: string }[] = [
      { id: "ALL", label: `All (${counts.total})` },
      { id: "DIRTY", label: `Dirty (${counts.dirty})` },
      { id: "IN_PROGRESS", label: `In progress (${counts.inProgress})` },
      { id: "CLEAN", label: `Clean (${counts.clean})` },
      { id: "VIP", label: `VIP (${counts.vip})` },
    ];
    floors.forEach((fl) => {
      const flCount = vm.tasks.filter((t) => t.floor === fl).length;
      chips.push({ id: `FLOOR_${fl}`, label: `Floor ${fl} (${flCount})` });
    });
    return chips;
  }, [counts, floors, vm.tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let list = [...vm.tasks];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const room = (t.roomNumber || "").toLowerCase();
        const guest = (t.guestName || "").toLowerCase();
        const flight = (t.flightNumber || "").toLowerCase();
        const rType = (t.roomType || "").toLowerCase();
        const fl = `floor ${t.floor}`.toLowerCase();
        return (
          room.includes(q) ||
          guest.includes(q) ||
          flight.includes(q) ||
          rType.includes(q) ||
          fl.includes(q)
        );
      });
    }

    if (activeFilter === "DIRTY") {
      list = list.filter((t) => t.cleaningStatus === CleaningStatus.DIRTY);
    } else if (activeFilter === "IN_PROGRESS") {
      list = list.filter((t) => t.cleaningStatus === CleaningStatus.IN_PROGRESS);
    } else if (activeFilter === "CLEAN") {
      list = list.filter(
        (t) =>
          t.cleaningStatus === CleaningStatus.CLEAN ||
          t.cleaningStatus === CleaningStatus.INSPECTED
      );
    } else if (activeFilter === "VIP") {
      list = list.filter((t) => t.isVip);
    } else if (activeFilter.startsWith("FLOOR_")) {
      const fl = parseInt(activeFilter.replace("FLOOR_", ""), 10);
      list = list.filter((t) => t.floor === fl);
    }

    const dir = sortDirection === "asc" ? 1 : -1;

    list.sort((a, b) => {
      if (sortField === "roomNumber") {
        const numA = parseInt(a.roomNumber, 10) || 0;
        const numB = parseInt(b.roomNumber, 10) || 0;
        return (numA - numB) * dir;
      }
      if (sortField === "floor") {
        if (a.floor !== b.floor) return (a.floor - b.floor) * dir;
        const numA = parseInt(a.roomNumber, 10) || 0;
        const numB = parseInt(b.roomNumber, 10) || 0;
        return numA - numB;
      }
      if (sortField === "status") {
        const statusWeight: Record<string, number> = {
          DIRTY: 0,
          IN_PROGRESS: 1,
          CLEAN: 2,
          INSPECTED: 3,
        };
        const wA = statusWeight[a.cleaningStatus] ?? 9;
        const wB = statusWeight[b.cleaningStatus] ?? 9;
        if (wA !== wB) return (wA - wB) * dir;
        return ((a.priorityScore ?? 0) - (b.priorityScore ?? 0)) * dir;
      }
      if (a.isVip !== b.isVip) {
        return (a.isVip ? -1 : 1) * dir;
      }
      const timeA = new Date(a.targetReadyBy).getTime() || 0;
      const timeB = new Date(b.targetReadyBy).getTime() || 0;
      return (timeA - timeB) * dir;
    });

    return list;
  }, [vm.tasks, searchQuery, activeFilter, sortField, sortDirection]);

  const activeSortLabel = useMemo(() => {
    switch (sortField) {
      case "priority":
        return "Priority";
      case "roomNumber":
        return "Room #";
      case "floor":
        return "Floor";
      case "status":
        return "Status";
      default:
        return "Sort";
    }
  }, [sortField]);

  const renderItem = ({ item }: { item: HousekeepingTask }) => {
    const isBusy = vm.updatingRoomId === item.roomId;

    return (
      <Card>
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
          <Badge label="Unassigned · tap Start to take this room" tone="neutral" />
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
              style={styles.infoRow}
            />
          ) : null}
          {item.flightNumber ? (
            <InfoRow icon="plane" label="Flight" value={item.flightNumber} style={styles.infoRow} />
          ) : null}
          <InfoRow
            icon="clock"
            label="Ready by"
            value={formatTime(item.targetReadyBy)}
            valueStyle={item.isVip ? styles.urgent : undefined}
            style={styles.infoRow}
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
            : `${toTurn} to turn around · ${filteredAndSortedTasks.length} shown`
        }
      />

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color={ui.textTertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search room #, guest, flight, type..."
            placeholderTextColor={ui.textTertiary}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={10}>
              <Icon name="close" size={16} color={ui.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter & Sort Controls Row */}
      <View style={styles.filterSortRow}>
        <TouchableOpacity
          onPress={() => setShowSortModal(true)}
          style={styles.sortPill}
          activeOpacity={0.8}
        >
          <Icon
            name={sortDirection === "asc" ? "arrowUp" : "arrowDown"}
            size={11}
            color={ui.brand}
            weight="bold"
          />
          <Text style={styles.sortPillText}>{activeSortLabel}</Text>
          <Icon name="chevronDown" size={10} color={ui.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
          style={styles.directionToggleBtn}
          accessibilityRole="button"
          accessibilityLabel={`Swap sort direction to ${sortDirection === "asc" ? "descending" : "ascending"}`}
          activeOpacity={0.7}
        >
          <Icon name="sort" size={13} color={ui.brand} />
        </TouchableOpacity>

        <View style={styles.sortDivider} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterChips.map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => setActiveFilter(chip.id)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
          data={filteredAndSortedTasks}
          keyExtractor={(item, index) => `${item.dispatchId || item.roomId || "room"}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={listContent}
          refreshControl={
            <RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.onRefresh} tintColor={ui.brand} />
          }
          ListEmptyComponent={
            <EmptyState
              mascot={searchQuery || activeFilter !== "ALL" ? "sleeping" : "happy"}
              title={searchQuery || activeFilter !== "ALL" ? "No rooms match" : "All rooms are turned around"}
              subtitle={
                searchQuery || activeFilter !== "ALL"
                  ? "Try resetting your search or filter options."
                  : "Nothing is assigned to your shift right now."
              }
              actionLabel={searchQuery || activeFilter !== "ALL" ? "Reset filters" : undefined}
              onAction={() => {
                setSearchQuery("");
                setActiveFilter("ALL");
              }}
            />
          }
        />
      )}

      {/* Sort Options Bottom Sheet Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSortModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Sort Rooms</Text>
                  <TouchableOpacity
                    onPress={() => setShowSortModal(false)}
                    style={styles.modalDoneBtn}
                    hitSlop={10}
                  >
                    <Text style={styles.modalDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSectionLabel}>ORDER DIRECTION</Text>
                <View style={styles.directionSegmented}>
                  <TouchableOpacity
                    onPress={() => setSortDirection("asc")}
                    style={[
                      styles.directionTab,
                      sortDirection === "asc" && styles.directionTabActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name="arrowUp"
                      size={13}
                      color={sortDirection === "asc" ? ui.brand : ui.textSecondary}
                      weight="bold"
                    />
                    <Text
                      style={[
                        styles.directionTabText,
                        sortDirection === "asc" && styles.directionTabTextActive,
                      ]}
                    >
                      Ascending
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSortDirection("desc")}
                    style={[
                      styles.directionTab,
                      sortDirection === "desc" && styles.directionTabActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name="arrowDown"
                      size={13}
                      color={sortDirection === "desc" ? ui.brand : ui.textSecondary}
                      weight="bold"
                    />
                    <Text
                      style={[
                        styles.directionTabText,
                        sortDirection === "desc" && styles.directionTabTextActive,
                      ]}
                    >
                      Descending
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>SORT ATTRIBUTE</Text>
                <View style={styles.fieldsContainer}>
                  {SORT_FIELDS.map((field) => {
                    const isSelected = sortField === field.key;
                    const hint = sortDirection === "asc" ? field.ascHint : field.descHint;

                    return (
                      <TouchableOpacity
                        key={field.key}
                        onPress={() => {
                          if (isSelected) {
                            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                          } else {
                            setSortField(field.key);
                          }
                        }}
                        style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modalOptionTextWrap}>
                          <Text
                            style={[
                              styles.modalOptionText,
                              isSelected && styles.modalOptionTextActive,
                            ]}
                          >
                            {field.label}
                          </Text>
                          <Text style={styles.modalOptionHint}>{hint}</Text>
                        </View>

                        {isSelected ? (
                          <View style={styles.modalSelectedIndicator}>
                            <Icon
                              name={sortDirection === "asc" ? "arrowUp" : "arrowDown"}
                              size={13}
                              color={ui.brand}
                              weight="bold"
                            />
                            <Icon name="check" size={15} color={ui.brand} weight="bold" />
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
  rows: { gap: 6 },
  infoRow: { paddingVertical: 0, borderBottomWidth: 0 },
  guestValue: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  guestName: { ...type.subheadStrong, color: ui.text, flexShrink: 1 },
  urgent: { color: ui.danger },
  footnote: { ...type.footnote, color: ui.textSecondary, textAlign: "center", paddingVertical: 4 },
  footnoteSuccess: { color: ui.success, fontWeight: "600" },

  // Search Bar
  searchContainer: {
    paddingHorizontal: gutter,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ui.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.separator,
  },
  searchInput: {
    flex: 1,
    ...type.subhead,
    color: ui.text,
    padding: 0,
  },

  // Filter & Sort Controls Row
  filterSortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: gutter,
    marginBottom: 12,
  },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: ui.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.separator,
  },
  sortPillText: {
    ...type.caption,
    color: ui.text,
    fontWeight: "600",
  },
  directionToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },
  sortDivider: {
    width: StyleSheet.hairlineWidth,
    height: 18,
    backgroundColor: ui.separator,
    marginHorizontal: 8,
  },
  filterScroll: {
    gap: 6,
    alignItems: "center",
    paddingRight: gutter,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: ui.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.separator,
  },
  filterChipActive: {
    backgroundColor: ui.brandSoft,
    borderColor: ui.brand,
  },
  filterChipText: {
    ...type.caption,
    color: ui.textSecondary,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: ui.brand,
    fontWeight: "700",
  },

  // Sort Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: ui.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    ...type.headline,
    color: ui.text,
  },
  modalDoneBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalDoneText: {
    ...type.headline,
    color: ui.brand,
    fontWeight: "700",
  },
  modalSectionLabel: {
    ...type.caption,
    color: ui.textTertiary,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  directionSegmented: {
    flexDirection: "row",
    backgroundColor: ui.surfaceMuted,
    borderRadius: radii.md,
    padding: 3,
  },
  directionTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.sm,
  },
  directionTabActive: {
    backgroundColor: ui.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  directionTabText: {
    ...type.footnote,
    color: ui.textSecondary,
    fontWeight: "500",
  },
  directionTabTextActive: {
    color: ui.brand,
    fontWeight: "700",
  },
  fieldsContainer: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.separator,
    backgroundColor: ui.surface,
    overflow: "hidden",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.separator,
  },
  modalOptionSelected: {
    backgroundColor: ui.brandSoft,
  },
  modalOptionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  modalOptionText: {
    ...type.body,
    color: ui.text,
  },
  modalOptionTextActive: {
    color: ui.brand,
    fontWeight: "700",
  },
  modalOptionHint: {
    ...type.caption,
    color: ui.textSecondary,
    marginTop: 2,
  },
  modalSelectedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
});
