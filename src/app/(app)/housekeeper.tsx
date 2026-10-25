import React from "react";
import { useHousekeeperVm } from "../../modules/housekeeper/viewModel/housekeeperPageVm";
import { HousekeeperView } from "../../modules/housekeeper/view/HousekeeperView";

export default function HousekeeperScreen() {
  const vm = useHousekeeperVm();
  return <HousekeeperView vm={vm} />;
}
