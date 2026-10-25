class NetworkConfig {
  private static _shared: NetworkConfig;

  static get shared(): NetworkConfig {
    if (!NetworkConfig._shared) {
      NetworkConfig._shared = new NetworkConfig();
    }
    return NetworkConfig._shared;
  }

  get baseURL(): string {
    const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (raw && raw.trim()) {
      return raw.replace(/\/+$/, "");
    }
    return "http://localhost:8080/api";
  }

  authRefreshUrl(): string {
    return `${this.baseURL}/auth/refresh`;
  }
}

export default NetworkConfig;
