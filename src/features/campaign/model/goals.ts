import type { Game, Goal } from "../../../shared/types";
import { dayTotals } from "../lib/money";

export function goalMet(g: Game, goal: Goal): boolean {
  if (goal.kind === "served") return g.served >= goal.amount;
  return dayTotals(g, g.day).net >= goal.amount;
}

export function goalProgress(g: Game, goal: Goal): { now: number; pct: number } {
  const now = goal.kind === "served" ? g.served : dayTotals(g, g.day).net;
  return { now, pct: Math.min(100, Math.round((now / goal.amount) * 100)) };
}

export function describeGoal(goal: Goal): string {
  return goal.label;
}
