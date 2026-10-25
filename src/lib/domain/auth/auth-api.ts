import { postRequest } from "../api/NetworkManager";
import { AuthResponse, AuthTokens } from "../../types";

export interface LoginDto {
  email: string;
  password?: string;
}

export const authApi = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    return postRequest<AuthResponse, LoginDto>("/auth/login", dto, { isPublic: true });
  },

  async logout(userId: string, refreshToken: string): Promise<void> {
    return postRequest<void, { userId: string; refreshToken: string }>("/auth/logout", {
      userId,
      refreshToken,
    });
  },

  async refresh(userId: string, refreshToken: string): Promise<AuthTokens> {
    return postRequest<AuthTokens, { userId: string; refreshToken: string }>(
      "/auth/refresh",
      { userId, refreshToken },
      { isPublic: true }
    );
  },
};
