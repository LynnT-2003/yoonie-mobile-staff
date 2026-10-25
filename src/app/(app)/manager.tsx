import React from "react";
import { useManagerVm } from "../../modules/manager/viewModel/managerPageVm";
import { ManagerView } from "../../modules/manager/view/ManagerView";

export default function ManagerScreen() {
  const vm = useManagerVm();
  return <ManagerView vm={vm} />;
}
