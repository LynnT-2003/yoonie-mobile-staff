import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { MascotExpression } from "../../constants/brandAssets";
import { EmptyState } from "../ui";

interface MascotStateProps {
  expression: MascotExpression;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Kept for existing call sites; renders the shared EmptyState. */
export const MascotState: React.FC<MascotStateProps> = ({
  expression,
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}) => (
  <View style={style}>
    <EmptyState mascot={expression} title={title} subtitle={subtitle} actionLabel={actionLabel} onAction={onAction} />
  </View>
);
