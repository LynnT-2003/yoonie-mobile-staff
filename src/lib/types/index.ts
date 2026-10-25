/**
 * Re-export generated OpenAPI types matching Yoonie Backend schemas 1:1.
 * Auto-generated via `npm run types:generate` from /api/docs-json.
 */

import type { components, paths } from "./openapi";

export type { components, paths };

// ─── Direct Schema Re-exports ───────────────────────────────────────────────

export type Schemas = components["schemas"];

export type UserPublicDto = Schemas["UserPublicDto"];
export type AuthTokensDto = Schemas["AuthTokensDto"];
export type AuthResponseDto = Schemas["AuthResponseDto"];
export type ChangePasswordDto = Schemas["ChangePasswordDto"];

export type HousekeepingTaskDto = Schemas["HousekeepingTaskDto"];
export type PickupPayloadResponseDto = Schemas["PickupPayloadResponseDto"];
export type PickupCardResponseDto = Schemas["PickupCardResponseDto"];
export type HousekeepingPayloadResponseDto = Schemas["HousekeepingPayloadResponseDto"];
export type ConsolidationPayloadResponseDto = Schemas["ConsolidationPayloadResponseDto"];

/** An airport pickup step by step; the driver reports each one. Forward only. */
export type PickupStage =
  | "ASSIGNED"
  | "CONFIRMED"
  | "EN_ROUTE"
  | "AT_AIRPORT"
  | "GUEST_ON_BOARD"
  | "DROPPED_OFF";

export type PickupIssueKind = "FLIGHT_DELAYED" | "GUEST_NOT_FOUND" | "VEHICLE_PROBLEM" | "OTHER";

export type PickupStepItem = { stage: PickupStage; at: string; byName?: string; note?: string };

// PickupTaskDto from staff tasks endpoint
export type PickupTaskDto = {
  dispatchId: string;
  orderId: string;
  guestName: string;
  guestPhone?: string;
  flightNumber: string;
  etaAt: string;
  meetingDoor?: number;
  vehiclePlate?: string;
  dispatchStatus: Schemas["HousekeepingTaskDto"]["dispatchStatus"];
  deliveryStatus: string;
  card?: {
    en: string;
    th: string;
  };
  stage?: PickupStage;
  steps?: PickupStepItem[];
  /** a problem the driver raised that the desk hasn't answered yet */
  issue?: { kind: PickupIssueKind; note?: string; at: string };
};

export type StaffTasksResponseDto = {
  housekeeping: HousekeepingTaskDto[];
  pickups: PickupTaskDto[];
};

export type RoomTransitionDto = Schemas["RoomTransitionDto"];
export type RoomTransitionResponseDto = Schemas["RoomTransitionResponseDto"];
export type PickupTaskResponseDto = Schemas["PickupTaskResponseDto"];
export type LineLinkTokenResponseDto = Schemas["LineLinkTokenResponseDto"];

export type HousekeepingBoardResponseDto = Schemas["HousekeepingBoardResponseDto"];
export type RoomResponseDto = Schemas["RoomResponseDto"];

export type DispatchTaskResponseDto = Schemas["DispatchTaskResponseDto"];
export type UpdateDispatchStatusDto = Schemas["UpdateDispatchStatusDto"];

export type DeviceResponseDto = Schemas["DeviceResponseDto"];
export type RegisterDeviceDto = Schemas["RegisterDeviceDto"];
export type NotificationResponseDto = Schemas["NotificationResponseDto"];
export type UnreadCountResponseDto = Schemas["UnreadCountResponseDto"];

// ─── Enums & Domain Aliases ─────────────────────────────────────────────────

export const UserRole = {
  GUEST: "GUEST" as const,
  STAFF: "STAFF" as const,
  DISPATCHER: "DISPATCHER" as const,
  BRANCH_MGR: "BRANCH_MGR" as const,
  ADMIN: "ADMIN" as const,
};
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export type StaffPermission = Schemas["UserPublicDto"]["permissions"][number];

export type ICurrentUser = Partial<Omit<UserPublicDto, "jobTitle" | "email" | "role">> & {
  _id: string;
  userId?: string;
  email?: string | null;
  displayName: string;
  role: UserRole;
  jobTitle?: string | null;
  branchIds: string[];
  permissions?: StaffPermission[];
  mustChangePassword?: boolean;
};

export type AuthTokens = AuthTokensDto;
export type AuthResponse = {
  user: ICurrentUser;
  tokens: AuthTokensDto;
};

export const CleaningStatus = {
  CLEAN: "CLEAN" as const,
  DIRTY: "DIRTY" as const,
  IN_PROGRESS: "IN_PROGRESS" as const,
  INSPECTED: "INSPECTED" as const,
};
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type CleaningStatus = (typeof CleaningStatus)[keyof typeof CleaningStatus];

export const DispatchStatus = {
  OPEN: "OPEN" as const,
  ACKNOWLEDGED: "ACKNOWLEDGED" as const,
  IN_PROGRESS: "IN_PROGRESS" as const,
  DONE: "DONE" as const,
  DISMISSED: "DISMISSED" as const,
};
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DispatchStatus = (typeof DispatchStatus)[keyof typeof DispatchStatus];

export const DispatchType = {
  HOUSEKEEPING_TURNAROUND: "HOUSEKEEPING_TURNAROUND" as const,
  TOUR_CONSOLIDATION: "TOUR_CONSOLIDATION" as const,
  AIRPORT_PICKUP: "AIRPORT_PICKUP" as const,
};
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DispatchType = (typeof DispatchType)[keyof typeof DispatchType];

export const Severity = {
  INFO: "INFO" as const,
  WARN: "WARN" as const,
  CRITICAL: "CRITICAL" as const,
};
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Severity = (typeof Severity)[keyof typeof Severity];

export const MessageChannel = {
  WHATSAPP: "WHATSAPP" as const,
  LINE: "LINE" as const,
};
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type MessageChannel = (typeof MessageChannel)[keyof typeof MessageChannel];

// Aliases for screen consumption
export type RoomItem = RoomResponseDto;
export type HousekeepingBoardResponse = HousekeepingBoardResponseDto;
/** /dispatch adds the room's live cleaning status and the owner's name to each task. */
export type DispatchTaskItem = Omit<DispatchTaskResponseDto, "pickup"> & {
  pickup?: DispatchTaskResponseDto["pickup"] & {
    stage?: PickupStage;
    steps?: PickupStepItem[];
    issue?: { kind: PickupIssueKind; note?: string; at: string; resolvedAt?: string };
  };
  cleaningStatus?: CleaningStatus;
  assigneeName?: string;
};

export type TourDecision = "KEEP" | "MERGE" | "CANCEL";

/** Room work from /staff/me/tasks; `isMine` is false while the room is in the open pool. */
export type HousekeepingTask = HousekeepingTaskDto & {
  assigneeUserId?: string;
  isMine?: boolean;
};
export type StaffNotification = NotificationResponseDto;
