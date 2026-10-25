import NetworkConfig from "./NetworkConfig";
import ApiStatusCodes from "./ApiStatusCodes";
import { ApiError, isAccountSuspendedMessage } from "./ApiError";
import { tokenStore } from "./tokenStore";

export { ApiError, isAccountSuspendedMessage };

export type RequestOptions = RequestInit & {
  _retry?: boolean;
  isPublic?: boolean;
  idempotencyKey?: string;
};

export type PublicRequestOptions = Pick<RequestOptions, "isPublic" | "idempotencyKey">;

type OnSessionExpired = () => void;
let _onSessionExpired: OnSessionExpired = () => {};

export const setSessionExpiredHandler = (fn: OnSessionExpired) => {
  _onSessionExpired = fn;
};

const getErrorTitle = (statusCode: number): string => {
  switch (statusCode) {
    case ApiStatusCodes.BAD_REQUEST:
      return "Bad Request";
    case ApiStatusCodes.UNAUTHORIZED:
      return "Unauthorized";
    case ApiStatusCodes.FORBIDDEN:
      return "Forbidden";
    case ApiStatusCodes.NOT_FOUND:
      return "Not Found";
    case ApiStatusCodes.CONFLICT:
      return "Conflict";
    case ApiStatusCodes.TOO_MANY_REQUESTS:
      return "Too Many Requests";
    case ApiStatusCodes.INTERNAL_SERVER_ERROR:
      return "Server Error";
    case ApiStatusCodes.SERVICE_UNAVAILABLE:
      return "Service Unavailable";
    default:
      return "Error";
  }
};

const toHeaderRecord = (init: HeadersInit | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!init) return out;
  if (init instanceof Headers) {
    init.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  if (Array.isArray(init)) {
    for (const [k, v] of init) out[k] = v;
    return out;
  }
  return { ...init };
};

const hasAuthorizationHeader = (headers: Record<string, string>): boolean =>
  Object.keys(headers).some((k) => k.toLowerCase() === "authorization");

const generateUUID = (): string => {
  return "idemp_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 11);
};

const buildFetchHeaders = (
  init: HeadersInit | undefined,
  token: string | null,
  isPublic: boolean,
  method?: string,
  idempotencyKey?: string
): Record<string, string> => {
  const headers = toHeaderRecord(init);
  if (!headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (!isPublic && token && !hasAuthorizationHeader(headers)) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Idempotency-Key on mutations
  const m = (method || "GET").toUpperCase();
  const isMutation = m === "POST" || m === "PATCH" || m === "PUT" || m === "DELETE";
  if (isMutation) {
    const existingKey = Object.keys(headers).find((k) => k.toLowerCase() === "idempotency-key");
    if (!existingKey) {
      headers["Idempotency-Key"] = idempotencyKey || generateUUID();
    }
  }

  return headers;
};

const responseHandler = async <T>(response: Response): Promise<T> => {
  let data: unknown;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("[NetworkManager] Failed to parse JSON:", e);
    data = {};
  }

  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  if (!response.ok) {
    const msg = body.message;
    const message =
      typeof msg === "string" && msg
        ? msg
        : Array.isArray(msg)
        ? msg.join(", ")
        : "An error occurred";

    const isSuspended =
      isAccountSuspendedMessage(message) &&
      (response.status === ApiStatusCodes.UNAUTHORIZED ||
        response.status === ApiStatusCodes.FORBIDDEN);

    throw new ApiError({
      message,
      statusCode: response.status,
      errorTitle: getErrorTitle(response.status),
      isAccountSuspended: isSuspended,
    });
  }

  // Unwrap NestJS envelope: { success, statusCode, data, timestamp }
  if (body && typeof body === "object" && "data" in body && "success" in body) {
    return body.data as T;
  }
  return data as T;
};

// ─── Singleton ────────────────────────────────────────────────────────────────

class NetworkManager {
  private static instance: NetworkManager;
  private refreshPromise: Promise<string | null> | null = null;
  private sessionInvalidateHandled = false;

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  private async silentRefresh(): Promise<string | null> {
    const refreshToken = tokenStore.getRefreshToken();
    const userId = tokenStore.getUserId();
    if (!refreshToken || !userId) return null;

    try {
      const res = await fetch(NetworkConfig.shared.authRefreshUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, refreshToken }),
      });

      const text = await res.text();
      const parsed: unknown = text ? JSON.parse(text) : {};
      const body =
        parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};

      if (!res.ok) {
        return null;
      }

      const rawData = ((body.data ?? parsed) || {}) as Record<string, any>;
      const accessToken =
        (typeof rawData.accessToken === "string" && rawData.accessToken) ||
        (rawData.tokens &&
          typeof rawData.tokens.accessToken === "string" &&
          rawData.tokens.accessToken) ||
        null;

      const refreshTokenNew =
        (typeof rawData.refreshToken === "string" && rawData.refreshToken) ||
        (rawData.tokens &&
          typeof rawData.tokens.refreshToken === "string" &&
          rawData.tokens.refreshToken) ||
        refreshToken; // Preserve existing refreshToken if server didn't issue a new one

      if (!accessToken) {
        return null;
      }

      tokenStore.updateTokens(accessToken, refreshTokenNew);
      return accessToken;
    } catch {
      return null;
    }
  }

  private handleSessionExpired(): void {
    if (this.sessionInvalidateHandled) return;
    this.sessionInvalidateHandled = true;
    void tokenStore.clear();
    _onSessionExpired();
    setTimeout(() => {
      this.sessionInvalidateHandled = false;
    }, 3000);
  }

  private async runWithRefresh<T>(
    ctx: { isPublic: boolean; hadBearer: boolean; isRetry: boolean },
    execute: () => Promise<T>
  ): Promise<T> {
    try {
      return await execute();
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;

      const is401 = error.statusCode === ApiStatusCodes.UNAUTHORIZED;
      const hasRefreshToken = Boolean(tokenStore.getRefreshToken());
      const canRecover = is401 && hasRefreshToken && !ctx.isPublic && !ctx.isRetry;

      if (canRecover) {
        if (!this.refreshPromise) {
          this.refreshPromise = this.silentRefresh().finally(() => {
            this.refreshPromise = null;
          });
        }

        const newToken = await this.refreshPromise;

        if (!newToken) {
          this.handleSessionExpired();
          throw error;
        }

        return this.runWithRefresh<T>({ ...ctx, isRetry: true }, execute);
      }

      if (is401 && !ctx.isPublic) {
        this.handleSessionExpired();
      }

      throw error;
    }
  }

  async makeApiCall<T>(endpoint: string, options: RequestOptions): Promise<T> {
    const { _retry, isPublic, idempotencyKey, ...fetchOptions } = options;
    const isRetry = !!_retry;
    const publicRoute = !!isPublic;
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const fullURL = `${NetworkConfig.shared.baseURL}${cleanEndpoint}`;

    const initialToken = tokenStore.get();
    const hadBearer =
      Boolean(initialToken) ||
      (fetchOptions.headers
        ? hasAuthorizationHeader(toHeaderRecord(fetchOptions.headers))
        : false);

    const runFetch = () => {
      const headers = buildFetchHeaders(
        fetchOptions.headers,
        tokenStore.get(),
        publicRoute,
        fetchOptions.method,
        idempotencyKey
      );
      return fetch(fullURL, { ...fetchOptions, headers }).then((response) =>
        responseHandler<T>(response)
      );
    };

    return this.runWithRefresh<T>(
      { isPublic: publicRoute, hadBearer, isRetry },
      runFetch
    );
  }
}

// ─── Instance & Public API ────────────────────────────────────────────────────

const networkManager = NetworkManager.getInstance();

const makeApiCall = <T>(endpoint: string, options: RequestOptions): Promise<T> =>
  networkManager.makeApiCall<T>(endpoint, options);

export const getRequest = async <T>(
  endpoint: string,
  opts?: PublicRequestOptions
): Promise<T> =>
  makeApiCall<T>(endpoint, {
    method: "GET",
    ...opts,
  });

export const postRequest = async <T, B = unknown>(
  endpoint: string,
  body: B,
  opts?: PublicRequestOptions
): Promise<T> =>
  makeApiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    ...opts,
  });

export const patchRequest = async <T, B = unknown>(
  endpoint: string,
  body: B,
  opts?: PublicRequestOptions
): Promise<T> =>
  makeApiCall<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
    ...opts,
  });

export const putRequest = async <T, B = unknown>(
  endpoint: string,
  body: B,
  opts?: PublicRequestOptions
): Promise<T> =>
  makeApiCall<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
    ...opts,
  });

export const deleteRequest = async <T, B = unknown>(
  endpoint: string,
  body?: B,
  opts?: PublicRequestOptions
): Promise<T> =>
  makeApiCall<T>(endpoint, {
    method: "DELETE",
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...opts,
  });
