import React from "react";
import { useInboxVm } from "../../modules/inbox/viewModel/inboxPageVm";
import { InboxView } from "../../modules/inbox/view/InboxView";

export default function InboxScreen() {
  const vm = useInboxVm();
  return <InboxView vm={vm} />;
}
