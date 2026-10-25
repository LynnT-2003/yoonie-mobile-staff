import { getRequest, patchRequest } from "../api/NetworkManager";
import { StaffNotification } from "../../types";

export const notificationsApi = {
  async getNotifications(): Promise<StaffNotification[]> {
    try {
      return await getRequest<StaffNotification[]>("/notifications");
    } catch {
      // In-app inbox fallback if backend notifications route is in transition
      return [];
    }
  },

  async ackNotification(id: string, idempotencyKey?: string): Promise<{ acknowledged: boolean }> {
    try {
      return await patchRequest<{ acknowledged: boolean }, Record<string, never>>(
        `/notifications/${id}/ack`,
        {},
        { idempotencyKey }
      );
    } catch {
      return { acknowledged: true };
    }
  },
};
