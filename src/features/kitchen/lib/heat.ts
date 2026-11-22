import type { RecipeId, Game, Stove } from "../../../shared/types";
import { recipes } from "../../../shared/catalog";
/** 等级越高，最佳火候窗口越宽；损耗会持续压低品质上限 */
export function quality(recipe: RecipeId, elapsed: number, tier = 1, wear = 0) {
  const target = recipes[recipe].target;
  const tolerance = 1 + tier;
  const miss = Math.max(0, Math.abs(elapsed - target) - tolerance);
  const wearPenalty = Math.round(wear * 6);
  return Math.max(0, Math.round(100 - miss * 12) - wearPenalty);
}
export function heatLabel(g: Game, s: Stove) {
  if (!s.portion) return "空闲";
  const t = g.time - s.started,
    ideal = recipes[s.portion.recipe].target,
    tolerance = 1 + s.tier;
  return t < ideal - tolerance
    ? "烹饪中"
    : t <= ideal + tolerance
      ? "最佳火候"
      : "即将焦糊";
}
