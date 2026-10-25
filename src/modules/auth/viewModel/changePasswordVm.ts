import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { postRequest } from "../../../lib/domain/api/NetworkManager";
import { useSession } from "../../../lib/session/sessionStore";
import { tokenStore } from "../../../lib/domain/api/tokenStore";

export function useChangePasswordVm() {
  const router = useRouter();
  const { currentUser, logout, getRoleRedirectPath } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = useCallback(async () => {
    if (!currentPassword) {
      setError("Please enter your current temporary password");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await postRequest("/auth/change-password", {
        oldPassword: currentPassword,
        newPassword,
      });

      if (currentUser) {
        const updated = { ...currentUser, mustChangePassword: false };
        await tokenStore.updateUser(updated);
        const destination = getRoleRedirectPath(updated);
        router.replace(destination as any);
      } else {
        router.replace("/(auth)/login" as any);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [currentPassword, newPassword, confirmPassword, currentUser, getRoleRedirectPath, router]);

  const handleSignOut = useCallback(async () => {
    await logout();
    router.replace("/(auth)/login" as any);
  }, [logout, router]);

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isSubmitting,
    error,
    userEmail: typeof currentUser?.email === "string" ? currentUser.email : "",
    handleChangePassword,
    handleSignOut,
  };
}

export type ChangePasswordVm = ReturnType<typeof useChangePasswordVm>;
