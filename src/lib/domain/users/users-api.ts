import { getRequest, patchRequest } from "../api/NetworkManager";
import { UserPublicDto } from "../../types";

export const usersApi = {
  async getMe(): Promise<UserPublicDto> {
    return getRequest<UserPublicDto>("/users/me");
  },

  async updateMe(dto: { displayName?: string }): Promise<UserPublicDto> {
    return patchRequest<UserPublicDto, { displayName?: string }>("/users/me", dto);
  },
};
