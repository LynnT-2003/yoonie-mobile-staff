/**
 * Yoonie Brand Mascot & Logo Asset Registry
 * Source: PRODUCT_GUIDELINES.md & yoonie-brand-assets
 *
 * Mascot Guide Triggers:
 * - calm: Welcoming hero, landing, default state, shift profile
 * - happy: Room inspected, dispatch 100% completed, pickup done
 * - checkingBooking: Reviewing cart/pickup signboard, inspecting room checklist
 * - thinking: Calculating inventory slot, yield consolidation, syncing mutations
 * - worried: Urgent alerts, session expired, wrong role, under-occupancy critical warning
 * - sleeping: All rooms clean & inspected, no dispatches, empty boards, off-hours
 */

export const brandMascot = {
  calm: require("../../assets/brand/mascot/yoonie-calm.png"),
  happy: require("../../assets/brand/mascot/yoonie-happy.png"),
  checkingBooking: require("../../assets/brand/mascot/yoonie-checking-booking.png"),
  thinking: require("../../assets/brand/mascot/yoonie-thinking.png"),
  worried: require("../../assets/brand/mascot/yoonie-worried.png"),
  sleeping: require("../../assets/brand/mascot/yoonie-sleeping.png"),
} as const;

export type MascotExpression = keyof typeof brandMascot;
