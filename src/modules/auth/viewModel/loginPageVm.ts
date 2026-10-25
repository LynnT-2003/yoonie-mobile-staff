import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useSession } from "../../../lib/session/sessionStore";
import { UserRole } from "../../../lib/types";

export interface SeededStaffPreset {
  name: string;
  role: string;
  jobTitle: string;
  email: string;
  userRole: UserRole;
}

export const SEEDED_STAFF_PRESETS: SeededStaffPreset[] = [
  {
    name: "Noi Prasert",
    role: "Housekeeping Staff",
    jobTitle: "HOUSEKEEPER",
    email: "noi@riverside-bkk.example",
    userRole: UserRole.STAFF,
  },
  {
    name: "Dao Wongsa",
    role: "Housekeeping Staff",
    jobTitle: "HOUSEKEEPER",
    email: "dao@riverside-bkk.example",
    userRole: UserRole.STAFF,
  },
  {
    name: "Somchai Rattana",
    role: "Driver Staff",
    jobTitle: "DRIVER",
    email: "somchai@riverside-bkk.example",
    userRole: UserRole.STAFF,
  },
  {
    name: "Prasit Kaew",
    role: "Driver Staff",
    jobTitle: "DRIVER",
    email: "prasit@riverside-bkk.example",
    userRole: UserRole.STAFF,
  },
  {
    name: "Mali Chaiyo",
    role: "Operations Dispatcher",
    jobTitle: "DISPATCHER",
    email: "mali@riverside-bkk.example",
    userRole: UserRole.DISPATCHER,
  },
  {
    name: "Anan Boonmee",
    role: "Branch Manager",
    jobTitle: "BRANCH_MGR",
    email: "anan@riverside-bkk.example",
    userRole: UserRole.BRANCH_MGR,
  },
];

export function useLoginVm() {
  const router = useRouter();
  const { login, getRoleRedirectPath } = useSession();
  const isDevMode = typeof __DEV__ !== "undefined" && Boolean(__DEV__);

  const [email, setEmail] = useState(
    isDevMode ? "noi@riverside-bkk.example" : ""
  );
  const [password, setPassword] = useState(
    isDevMode ? "Password123!" : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectPreset = useCallback(
    (preset: SeededStaffPreset) => {
      if (!isDevMode) return;
      setEmail(preset.email);
      setPassword("Password123!");
      setError(null);
    },
    [isDevMode]
  );

  const handleLogin = useCallback(async () => {
    if (!email.trim()) {
      setError("Please enter staff email");
      return;
    }
    if (!password) {
      setError("Please enter password");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(email.trim(), password);
      const destination = getRoleRedirectPath(user);
      router.replace(destination as any);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, router, getRoleRedirectPath]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
    error,
    isDevMode,
    presets: isDevMode ? SEEDED_STAFF_PRESETS : [],
    selectPreset,
    handleLogin,
  };
}

export type LoginVm = ReturnType<typeof useLoginVm>;
