import type { Game } from "../../../shared/types";
import { dayPlans } from "../../../shared/catalog";
import { activeOrders } from "../lib/patience";
import { rngNext, weightedRecipe } from "../../../shared/catalog";
import { cashEntry } from "../../campaign";

const guests = ["阿宁", "许小姐", "赵先生", "晓晴", "林小姐", "周先生", "小陈", "老陈"];
let guestSeq = 3;

export function resetGuestSeq() {
  guestSeq = 3;
}

export function accept(g: Game, id: number) {
  const o = g.orders.find((o) => o.id === id);
  if (o?.status !== "waiting") return;
  o.status = "accepted";
  g.selectedOrder = id;
  g.notice = "已接单，请备料并留意客人耐心。";
}
export function expire(g: Game) {
  for (const o of activeOrders(g)) {
    if (g.time >= o.deadline) {
      o.status = "left";
      g.missed++;
      g.combo = 0;
      if (g.selectedOrder === o.id) g.selectedOrder = null;
      cashEntry(g, `${o.guest} 等待超时`, -5, "miss");
      g.notice = `${o.guest} 离店，损失 ¥5`;
    }
  }
}
/** 按当天经营计划生成来客：节奏、菜单权重、耐心都随天数变化 */
export function arrive(g: Game) {
  const plan = dayPlans[g.day - 1];
  if (g.time < g.nextSpawnAt || g.time >= plan.spawnUntil) return;
  if (activeOrders(g).length >= plan.maxActive) return;
  g.nextSpawnAt = g.time + plan.spawnEvery;
  let r: number;
  [g.rngState, r] = rngNext(g.rngState);
  const recipe = weightedRecipe(r, plan.weights);
  [g.rngState, r] = rngNext(g.rngState);
  const jitter = Math.floor(r * 11) - 5;
  guestSeq++;
  g.orders.push({
    id: g.nextId++,
    recipe,
    guest: guests[guestSeq % guests.length],
    arrived: g.time,
    deadline: g.time + plan.patience + jitter,
    status: "waiting",
  });
}
