import React from "react";
import { useLoginVm } from "../../modules/auth/viewModel/loginPageVm";
import { LoginView } from "../../modules/auth/view/LoginView";

export default function LoginScreen() {
  const vm = useLoginVm();
  return <LoginView vm={vm} />;
}
