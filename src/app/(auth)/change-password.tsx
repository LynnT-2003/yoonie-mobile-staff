import React from "react";
import { useChangePasswordVm } from "../../modules/auth/viewModel/changePasswordVm";
import { ChangePasswordView } from "../../modules/auth/view/ChangePasswordView";

export default function ChangePasswordScreen() {
  const vm = useChangePasswordVm();
  return <ChangePasswordView vm={vm} />;
}
