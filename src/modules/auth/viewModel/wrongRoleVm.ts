import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useSession } from "../../../lib/session/sessionStore";

export function useWrongRoleVm() {
  const router = useRouter();
  const { currentUser, logout, refreshUserProfile, getRoleRedirectPath } = useSession();
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSignOut = useCallback(async () => {
    await logout();
    router.replace("/(auth)/login" as any);
  }, [logout, router]);

  const handleCheckPermissions = useCallback(async () => {
    setIsChecking(true);
    setStatusMessage(null);
    try {
      const freshUser = await refreshUserProfile();
      if (freshUser) {
        const path = getRoleRedirectPath(freshUser);
        if (path !== "/(auth)/wrong-role") {
          router.replace(path as any);
          return;
        }
      }
      setStatusMessage("Account still has non-staff permissions. Contact property management.");
    } catch {
      setStatusMessage("Failed to verify credentials with server.");
    } finally {
      setIsChecking(false);
    }
  }, [refreshUserProfile, getRoleRedirectPath, router]);

  return {
    currentUser,
    role: currentUser?.role || "GUEST",
    jobTitle: typeof currentUser?.jobTitle === "string" ? currentUser.jobTitle : "Not Assigned",
    email: typeof currentUser?.email === "string" ? currentUser.email : "Unknown email",
    displayName: currentUser?.displayName || "User",
    isChecking,
    statusMessage,
    handleSignOut,
    handleCheckPermissions,
  };
}

export type WrongRoleVm = ReturnType<typeof useWrongRoleVm>;
