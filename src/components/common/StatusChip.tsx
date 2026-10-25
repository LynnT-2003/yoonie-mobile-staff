import React from "react";
import { Badge, type BadgeTone } from "../ui";

export type StatusChipType =
  | "clean"
  | "dirty"
  | "inProgress"
  | "inspected"
  | "open"
  | "done"
  | "acknowledged"
  | "critical"
  | "warn"
  | "info";

interface StatusChipProps {
  status: StatusChipType | string;
  customLabel?: string;
}

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  CLEAN: { label: "Clean", tone: "info" },
  DIRTY: { label: "Dirty", tone: "danger" },
  IN_PROGRESS: { label: "In progress", tone: "warning" },
  INPROGRESS: { label: "In progress", tone: "warning" },
  INSPECTED: { label: "Inspected", tone: "success" },
  OPEN: { label: "To do", tone: "warning" },
  // retired status; old rows read as "to do"
  ACKNOWLEDGED: { label: "To do", tone: "warning" },
  DONE: { label: "Done", tone: "success" },
  DISMISSED: { label: "Dismissed", tone: "neutral" },
  CRITICAL: { label: "Critical", tone: "danger" },
  WARN: { label: "Warning", tone: "warning" },
  INFO: { label: "Info", tone: "neutral" },
};

/** Sentence-case status pill with a leading dot. */
export const StatusChip: React.FC<StatusChipProps> = ({ status, customLabel }) => {
  const key = (status || "").toUpperCase().replace(/[\s-]/g, "_");
  const conf = STATUS[key] ?? {
    label: key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, " "),
    tone: "neutral" as const,
  };
  return <Badge label={customLabel ?? conf.label} tone={conf.tone} dot />;
};
