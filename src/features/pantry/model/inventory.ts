import type { Game, RecipeId, Ingredient } from "../../../shared/types";
import { recipes, ingredients, STOCK_CAP } from "../../../shared/catalog";
import { preparationIssue } from "../lib/availability";
import { cashEntry } from "../../campaign";
export function prepare(g: Game, r: RecipeId) {
  const issue = preparationIssue(g, r);
  if (issue) {
    g.notice = issue;
    return;
  }
  g.stock[recipes[r].ingredient]--;
  g.portions.push({ id: g.nextId++, recipe: r, preparedAt: g.time });
  g.notice = `${recipes[r].name} 备料完成，可送入灶台`;
}
export function restock(g: Game, i: Ingredient) {
  if (g.stock[i] >= STOCK_CAP) {
    g.notice = `库存充足，上限${STOCK_CAP}份`;
    return;
  }
  const qty = Math.min(3, STOCK_CAP - g.stock[i]);
  const cost = ingredients[i].cost * qty;
  if (g.cash < cost) {
    g.notice = `现金不足，本次采购需要 ¥${cost}`;
    return;
  }
  g.stock[i] += qty;
  cashEntry(g, `临时采购${ingredients[i].name} ×${qty}`, -cost, "supply");
  g.notice = `已购入${qty}份食材，费用当场从现金扣除`;
}
