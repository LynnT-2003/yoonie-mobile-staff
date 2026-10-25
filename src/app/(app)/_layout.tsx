import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet, type ColorValue } from "react-native";
import { ui } from "../../constants/theme";
import { Icon, type IconName } from "../../components/ui";
import { useSession } from "../../lib/session/sessionStore";
import { UserRole } from "../../lib/types";

function tabIcon(name: IconName, activeName: IconName) {
  const TabIcon = ({ focused, color }: { focused: boolean; color: ColorValue }) => (
    <Icon name={focused ? activeName : name} size={24} color={color} />
  );
  return TabIcon;
}

export default function AppLayout() {
  const { currentUser } = useSession();
  const job = (currentUser?.jobTitle || "").toUpperCase();
  const role = currentUser?.role;

  const isHousekeeper = job.includes("HOUSEKEEPER");
  const isDriver = job.includes("DRIVER");
  const isDispatcher = role === UserRole.DISPATCHER || job.includes("DISPATCHER");
  const isManager = role === UserRole.BRANCH_MGR || role === UserRole.ADMIN || job.includes("MANAGER");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ui.brand,
        tabBarInactiveTintColor: ui.textTertiary,
        tabBarStyle: {
          backgroundColor: ui.surface,
          borderTopColor: ui.separator,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        sceneStyle: { backgroundColor: ui.canvas },
      }}
    >
      <Tabs.Screen
        name="housekeeper"
        options={{
          title: "Rooms",
          tabBarIcon: tabIcon("rooms", "roomsActive"),
          href: isHousekeeper || isManager ? "/(app)/housekeeper" : null,
        }}
      />

      <Tabs.Screen
        name="driver"
        options={{
          title: "Pickups",
          tabBarIcon: tabIcon("pickups", "pickupsActive"),
          href: isDriver || isManager ? "/(app)/driver" : null,
        }}
      />

      <Tabs.Screen
        name="dispatcher"
        options={{
          title: "Dispatch",
          tabBarIcon: tabIcon("dispatch", "dispatchActive"),
          href: isDispatcher || isManager ? "/(app)/dispatcher" : null,
        }}
      />

      <Tabs.Screen
        name="manager"
        options={{
          title: "Inspect",
          tabBarIcon: tabIcon("inspect", "inspectActive"),
          href: isManager ? "/(app)/manager" : null,
        }}
      />

      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: tabIcon("inbox", "inboxActive"),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: tabIcon("profile", "profileActive"),
        }}
      />
    </Tabs>
  );
}
