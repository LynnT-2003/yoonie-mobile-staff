import React from "react";
import { useProfileVm } from "../../modules/profile/viewModel/profilePageVm";
import { ProfileView } from "../../modules/profile/view/ProfileView";

export default function ProfileScreen() {
  const vm = useProfileVm();
  return <ProfileView vm={vm} />;
}
