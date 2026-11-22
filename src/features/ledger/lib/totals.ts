import type { Game } from "../../../shared/types";
import { dayTotals, campaignTotals } from "../../campaign";
export function totals(g: Game) {
  return dayTotals(g);
}
export function weekTotals(g: Game) {
  return campaignTotals(g);
}
export function grade(g: Game) {
  const n = dayTotals(g).net;
  return n >= 400 ? "S" : n >= 250 ? "A" : n >= 120 ? "B" : "C";
}
