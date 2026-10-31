import React from "react";
import type { ColorValue } from "react-native";
import { SymbolView, type AndroidSymbol, type SFSymbol, type SymbolWeight } from "expo-symbols";
import { ui } from "../../constants/theme";

/**
 * Semantic icon set. Each entry maps to an SF Symbol (iOS) and a Material Symbol
 * (Android / web) so screens never reference platform names directly.
 */
const ICONS = {
  rooms: { ios: "bed.double", android: "bed" },
  roomsActive: { ios: "bed.double.fill", android: "bed" },
  pickups: { ios: "car", android: "directions_car" },
  pickupsActive: { ios: "car.fill", android: "directions_car" },
  dispatch: { ios: "list.bullet.clipboard", android: "assignment" },
  dispatchActive: { ios: "list.bullet.clipboard.fill", android: "assignment" },
  inspect: { ios: "checkmark.seal", android: "fact_check" },
  inspectActive: { ios: "checkmark.seal.fill", android: "fact_check" },
  inbox: { ios: "tray", android: "inbox" },
  inboxActive: { ios: "tray.fill", android: "inbox" },
  profile: { ios: "person.crop.circle", android: "account_circle" },
  profileActive: { ios: "person.crop.circle.fill", android: "account_circle" },
  chevronRight: { ios: "chevron.right", android: "chevron_right" },
  chevronDown: { ios: "chevron.down", android: "expand_more" },
  chevronUp: { ios: "chevron.up", android: "expand_less" },
  clock: { ios: "clock", android: "schedule" },
  plane: { ios: "airplane", android: "flight" },
  person: { ios: "person", android: "person" },
  people: { ios: "person.2", android: "group" },
  star: { ios: "star.fill", android: "star" },
  check: { ios: "checkmark", android: "check" },
  checkCircle: { ios: "checkmark.circle.fill", android: "check_circle" },
  alert: { ios: "exclamationmark.triangle.fill", android: "warning" },
  info: { ios: "info.circle", android: "info" },
  bell: { ios: "bell", android: "notifications" },
  location: { ios: "mappin.and.ellipse", android: "location_on" },
  phone: { ios: "phone", android: "call" },
  wifiOff: { ios: "wifi.slash", android: "wifi_off" },
  sync: { ios: "arrow.triangle.2.circlepath", android: "sync" },
  logout: { ios: "rectangle.portrait.and.arrow.right", android: "logout" },
  building: { ios: "building.2", android: "apartment" },
  sparkles: { ios: "sparkles", android: "cleaning_services" },
  door: { ios: "door.left.hand.closed", android: "door_front" },
  search: { ios: "magnifyingglass", android: "search" },
  filter: { ios: "line.3.horizontal.decrease", android: "filter_list" },
  grid: { ios: "square.grid.2x2.fill", android: "grid_view" },
  list: { ios: "list.bullet", android: "view_list" },
  sort: { ios: "arrow.up.arrow.down", android: "swap_vert" },
  close: { ios: "xmark.circle.fill", android: "cancel" },
  arrowUp: { ios: "arrow.up", android: "arrow_upward" },
  arrowDown: { ios: "arrow.down", android: "arrow_downward" },
} satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  weight?: SymbolWeight;
};

export function Icon({ name, size = 20, color = ui.textSecondary, weight = "regular" }: IconProps) {
  const icon = ICONS[name];
  return (
    <SymbolView
      name={{ ios: icon.ios, android: icon.android, web: icon.android }}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}
