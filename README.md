# Yoonie Staff Mobile OS 📱

Frontline staff application for **Yoonie Hospitality OS** built with **Expo SDK 57 (React Native)** and **TypeScript**.

Mirrors the `yulio` Next.js frontend starter architecture translated to React Native:
- **`src/app/` (Expo Router):** Thin route screens only. Each route invokes a ViewModel hook and passes the ViewModel state to a pure render component (`<View vm={vm} />`).
- **`src/modules/<feature>/`:** Features contain MVVM separation (`viewModel/xPageVm.ts`, `view/XPageView.tsx`, dumb components).
- **`src/lib/domain/api/NetworkManager.ts`:** Singleton HTTP layer handling unwrap (`{ success, statusCode, data, timestamp }`), Bearer tokens, silent 401 refresh, idempotency keys, and typed `ApiError`.
- **`src/lib/offline/queue.ts`:** SQLite-backed mutation queue with idempotency keys, 409 drop-and-refetch, 403 drop-and-alert, and retry limits.
- **`src/lib/offline/taskCache.ts`:** SQLite local cache for offline launches and instant task rendering.

---

## Running in Expo Go with a LAN IP

To test on physical devices (iPhone/Android) via **Expo Go**, your mobile device and computer must be connected to the same Wi-Fi network.

### 1. Find your machine's LAN IP address

On macOS (Terminal):
```bash
ipconfig getifaddr en0
# Example output: 192.168.1.142
```
On Linux:
```bash
hostname -I | awk '{print $1}'
```
On Windows:
```bash
ipconfig
```

### 2. Ensure backend server accepts LAN connections

Ensure your NestJS backend (`yoonie-backend`) is running and listening on all interfaces (`0.0.0.0:8080`) or accessible from other local devices:
```bash
cd ../yoonie-backend
npm run start:dev
```
Verify from your mobile browser: `http://<YOUR_LAN_IP>:8080/api/docs`.

### 3. Start Expo with your LAN IP

Export `EXPO_PUBLIC_API_BASE_URL` pointing to your LAN IP, then start Expo with the `--host lan` flag:

```bash
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LAN_IP>:8080/api npx expo start --host lan
```

*Example:*
```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.142:8080/api npx expo start --host lan
```

### 4. Open in Expo Go

1. Open the camera app (iOS) or the **Expo Go** app (Android).
2. Scan the QR code displayed in the terminal.
3. The app will bundle and load over your local network.

> **Note on Push Notifications in Expo Go:**
> Starting in Expo SDK 51+, remote push notifications are not supported inside the standard Expo Go client sandbox. The app detects Expo Go (`Constants.appOwnership === "expo"`), catches push registration gracefully, and sets an informative "Push Unavailable in Expo Go" state instead of crashing. To test APNs/FCM push notifications natively, use a development build (`npx expo run:ios` / `npx expo run:android`) or an EAS build.

---

## Role Redirection & Credentials

Routing is strictly enforced based on **Backend Role + Job Title**:

| Role | Job Title | Destination Route | Description |
|---|---|---|---|
| `STAFF` | `HOUSEKEEPER` | `/(app)/housekeeper` | Room turnaround run-sheet sorted by priority score |
| `STAFF` | `DRIVER` | `/(app)/driver` | Airport pickups, flight ETAs, welcome signboards |
| `DISPATCHER` | *any* | `/(app)/dispatcher` | Central operations board & task status progression |
| `BRANCH_MGR` / `ADMIN` | *any* | `/(app)/manager` | Inspection queue & room release (requires `housekeeping:inspect`) |
| `GUEST` / Unrecognized | *any* | `/(auth)/wrong-role` | Account unauthorized screen with account switcher |
| *any* | *mustChangePassword=true* | `/(auth)/change-password` | Mandatory password update before shift access |

### Dev Presets (Dev Mode Only)
Login preset chips are strictly gated behind `__DEV__`. In development mode, tap any frontline staff member on the login screen to quickly switch roles. In preview and production builds, presets are omitted from the UI.

---

## Offline SQLite Queue & Task Caching

- **Idempotency Keys:** Every mutation generates a UUID key attached via `Idempotency-Key` header.
- **Replay rules:**
  - **HTTP 409 (Conflict):** Mutation dropped from the queue and task refetch is triggered immediately.
  - **HTTP 403 (Forbidden):** Mutation dropped from the queue and an alert message is broadcast to the staff member.
  - **Retry Limit:** Items fail permanently after 3 attempts, preventing infinite retry loops.
- **Task Cache:** Offline app launches immediately display the last fetched staff tasks from SQLite storage (`taskCache`).

---

## EAS Build Profiles

Configured in `app.json` (`ios.bundleIdentifier: si.yoonie.staff`, `android.package: si.yoonie.staff`, `projectId: b5e11413-41c1-4ca6-a5ce-f8fefd82dbf0`) and `eas.json`:

- **Preview APK (Android):**
  ```bash
  npx eas-cli build --profile preview --platform android
  ```
  Generates a standalone `.apk` file for direct installation on Android devices without Google Play.
- **Development Build:**
  ```bash
  npx eas-cli build --profile development --platform all
  ```
- **TestFlight (iOS):**
  ```bash
  npx eas-cli build --profile testflight --platform ios
  ```

---

## Type Generation

OpenAPI schemas are generated directly from the backend NestJS Swagger specification:

```bash
npm run types:generate
```

`src/lib/types/index.ts` re-exports generated OpenAPI types from `src/lib/types/openapi.d.ts`, eliminating hand-copied DTOs.
