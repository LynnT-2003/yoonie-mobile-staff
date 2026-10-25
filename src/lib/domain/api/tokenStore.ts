import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { ICurrentUser } from "../../types";

const ACCESS_KEY = "yoonie_staff_access_token";
const REFRESH_KEY = "yoonie_staff_refresh_token";
const USER_KEY = "yoonie_staff_current_user";

function extractSubFromJwt(token: string | null): string | null {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const jsonStr = typeof atob === "function" ? atob(b64) : null;
    if (!jsonStr) return null;
    const parsed = JSON.parse(jsonStr);
    return parsed.sub || parsed.userId || parsed.id || null;
  } catch {
    return null;
  }
}

class TokenStore {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private currentUser: ICurrentUser | null = null;
  private isInitialized = false;

  private async secureSet(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (e) {
      console.warn(`[TokenStore] Failed to write secure key ${key}`, e);
    }
  }

  private async secureGet(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn(`[TokenStore] Failed to read secure key ${key}`, e);
      return null;
    }
  }

  private async secureDelete(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      console.warn(`[TokenStore] Failed to delete secure key ${key}`, e);
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.accessToken = await this.secureGet(ACCESS_KEY);
    this.refreshToken = await this.secureGet(REFRESH_KEY);
    const userJson = await this.secureGet(USER_KEY);
    if (userJson) {
      try {
        this.currentUser = JSON.parse(userJson);
      } catch {
        this.currentUser = null;
      }
    }
    this.isInitialized = true;
  }

  get(): string | null {
    return this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  getUserId(): string | null {
    if (this.currentUser?.userId) return this.currentUser.userId;
    if (this.currentUser?._id) return this.currentUser._id;
    if ((this.currentUser as any)?.id) return (this.currentUser as any).id;
    return (
      extractSubFromJwt(this.accessToken) ??
      extractSubFromJwt(this.refreshToken) ??
      null
    );
  }

  getCurrentUser(): ICurrentUser | null {
    return this.currentUser;
  }

  setCurrentUser(user: ICurrentUser | null): void {
    this.currentUser = user;
    if (user) {
      void this.secureSet(USER_KEY, JSON.stringify(user));
    } else {
      void this.secureDelete(USER_KEY);
    }
  }

  async updateUser(user: ICurrentUser): Promise<void> {
    this.currentUser = user;
    await this.secureSet(USER_KEY, JSON.stringify(user));
  }

  updateTokens(access: string, refresh: string, user?: ICurrentUser): void {
    this.accessToken = access;
    this.refreshToken = refresh;
    void this.secureSet(ACCESS_KEY, access);
    void this.secureSet(REFRESH_KEY, refresh);
    if (user) {
      this.currentUser = user;
      void this.secureSet(USER_KEY, JSON.stringify(user));
    }
  }

  async clear(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.currentUser = null;
    await Promise.all([
      this.secureDelete(ACCESS_KEY),
      this.secureDelete(REFRESH_KEY),
      this.secureDelete(USER_KEY),
    ]);
  }
}

export const tokenStore = new TokenStore();
