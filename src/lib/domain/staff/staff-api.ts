import { getRequest, postRequest } from "../api/NetworkManager";
import {
  StaffTasksResponseDto,
  RoomTransitionDto,
  RoomTransitionResponseDto,
  PickupTaskResponseDto,
  LineLinkTokenResponseDto,
  HousekeepingBoardResponse,
  DispatchTaskItem,
  TourDecision,
  PickupStage,
  PickupIssueKind,
} from "../../types";

export const staffApi = {
  /** Tasks for the current staff member (Housekeeping & Pickups) */
  async getMyTasks(): Promise<StaffTasksResponseDto> {
    return getRequest<StaffTasksResponseDto>("/staff/me/tasks");
  },

  /** Transition room cleaning status and linked dispatch */
  async transitionRoom(
    roomId: string,
    dto: RoomTransitionDto,
    idempotencyKey?: string
  ): Promise<RoomTransitionResponseDto> {
    return postRequest<RoomTransitionResponseDto, RoomTransitionDto>(
      `/staff/rooms/${roomId}/transition`,
      dto,
      { idempotencyKey }
    );
  },

  /** Report the step a pickup has reached (accepted, left, at the door, guest on board, dropped off) */
  async recordPickupStep(
    dispatchId: string,
    stage: PickupStage,
    note?: string,
    idempotencyKey?: string
  ): Promise<PickupTaskResponseDto> {
    return postRequest<PickupTaskResponseDto, { stage: PickupStage; note?: string }>(
      `/staff/pickups/${dispatchId}/step`,
      { stage, ...(note ? { note } : {}) },
      { idempotencyKey }
    );
  },

  /** Tell the desk something is wrong; they answer with "keep waiting" or "no-show" */
  async reportPickupIssue(
    dispatchId: string,
    kind: PickupIssueKind,
    note?: string,
    idempotencyKey?: string
  ): Promise<PickupTaskResponseDto> {
    return postRequest<PickupTaskResponseDto, { kind: PickupIssueKind; note?: string }>(
      `/staff/pickups/${dispatchId}/issue`,
      { kind, ...(note ? { note } : {}) },
      { idempotencyKey }
    );
  },

  /** Desk's answer to a driver's problem: keep waiting, or close as a no-show */
  async answerPickupIssue(
    dispatchId: string,
    resolution: "KEEP_WAITING" | "NO_SHOW",
    note?: string
  ): Promise<DispatchTaskItem> {
    return postRequest<DispatchTaskItem, { resolution: string; note?: string }>(
      `/dispatch/${dispatchId}/pickup-issue`,
      { resolution, ...(note ? { note } : {}) }
    );
  },

  /** Create LINE notification link token */
  async createLineLinkToken(): Promise<LineLinkTokenResponseDto> {
    return postRequest<LineLinkTokenResponseDto, Record<string, never>>(
      "/staff/line/link-token",
      {}
    );
  },

  /** Housekeeping board (Manager inspection & room status overview) */
  async getHousekeepingBoard(branchId: string): Promise<HousekeepingBoardResponse> {
    return getRequest<HousekeepingBoardResponse>(
      `/rooms/housekeeping?branchId=${encodeURIComponent(branchId)}`
    );
  },

  /** Dispatch run-sheet board */
  async getDispatches(
    branchId: string,
    serviceDate?: string
  ): Promise<DispatchTaskItem[]> {
    const dateParam = serviceDate ? `&serviceDate=${encodeURIComponent(serviceDate)}` : "";
    return getRequest<DispatchTaskItem[]>(
      `/dispatch?branchId=${encodeURIComponent(branchId)}${dateParam}`
    );
  },

  /**
   * Close a tour fill flag with a decision. Room turnarounds are never set from the
   * dispatch board: they follow the room through transitionRoom.
   */
  async decideTour(
    dispatchId: string,
    decision: TourDecision,
    note?: string
  ): Promise<DispatchTaskItem> {
    return postRequest<DispatchTaskItem, { decision: TourDecision; note?: string }>(
      `/dispatch/${dispatchId}/decision`,
      { decision, ...(note ? { note } : {}) }
    );
  },
};
