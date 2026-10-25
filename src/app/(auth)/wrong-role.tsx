import React from "react";
import { useWrongRoleVm } from "../../modules/auth/viewModel/wrongRoleVm";
import { WrongRoleView } from "../../modules/auth/view/WrongRoleView";

export default function WrongRoleScreen() {
  const vm = useWrongRoleVm();
  return <WrongRoleView vm={vm} />;
}
