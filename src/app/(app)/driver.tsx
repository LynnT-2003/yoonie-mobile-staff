import React from "react";
import { useDriverVm } from "../../modules/driver/viewModel/driverPageVm";
import { DriverView } from "../../modules/driver/view/DriverView";

export default function DriverScreen() {
  const vm = useDriverVm();
  return <DriverView vm={vm} />;
}
