import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "../lib/session/sessionStore";
import { colors } from "../constants/theme";

export default function IndexScreen() {
  const router = useRouter();
  const { currentUser, isLoading, getRoleRedirectPath } = useSession();

  useEffect(() => {
    if (!isLoading) {
      const target = getRoleRedirectPath(currentUser);
      router.replace(target as any);
    }
  }, [isLoading, currentUser, getRoleRedirectPath, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
