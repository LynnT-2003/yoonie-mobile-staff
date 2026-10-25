import React from "react";
import { useDispatcherVm } from "../../modules/dispatcher/viewModel/dispatcherPageVm";
import { DispatcherView } from "../../modules/dispatcher/view/DispatcherView";

export default function DispatcherScreen() {
  const vm = useDispatcherVm();
  return <DispatcherView vm={vm} />;
}
