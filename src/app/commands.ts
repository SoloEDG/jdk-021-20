import type { Game, Command } from "../shared/types";
import { accept, expire } from "../features/orders";
import { prepare, restock } from "../features/pantry";
import { cook, lift } from "../features/kitchen";
import { plate, discard, deliver } from "../features/service";
import {
  startDay,
  retryPractice,
  exitPractice,
  advance,
  newCampaign,
  buyUpgrade,
  repair,
  preorder,
  saveCampaign,
} from "../features/campaign";

const kitchenCommands = new Set<Command["type"]>([
  "accept",
  "select-order",
  "prepare",
  "restock",
  "cook",
  "lift",
  "plate",
  "select-dish",
  "serve",
  "discard",
]);

export function dispatch(g: Game, c: Command) {
  if (kitchenCommands.has(c.type)) {
    // 厨房操作只在营业中生效，暂停 / 打烊 / 简报阶段全部拦截
    if (g.phase !== "serving" || !g.running || g.ended) {
      g.notice = "请先开始营业，暂停或打烊后不能操作厨房";
      return;
    }
    switch (c.type) {
      case "accept":
        accept(g, c.id);
        break;
      case "select-order":
        if (g.orders.some((o) => o.id === c.id && o.status === "accepted"))
          g.selectedOrder = c.id;
        break;
      case "prepare":
        prepare(g, c.recipe);
        break;
      case "restock":
        restock(g, c.ingredient);
        break;
      case "cook":
        cook(g, c.portion, c.stove);
        break;
      case "lift":
        lift(g, c.id);
        break;
      case "plate":
        plate(g, c.id);
        break;
      case "select-dish":
        if (g.dishes.some((d) => d.id === c.id && d.stage === "plated"))
          g.selectedDish = c.id;
        break;
      case "serve":
        deliver(g);
        expire(g);
        break;
      case "discard":
        discard(g, c.id);
        break;
    }
    // 练习模式不写盘，杜绝练习收入通过刷新落袋
    if (!g.practice) saveCampaign(g);
    return;
  }
  switch (c.type) {
    case "start-day":
      startDay(g, c.practice);
      break;
    case "retry-practice":
      retryPractice(g);
      break;
    case "exit-practice":
      exitPractice(g);
      break;
    case "advance":
      // advance 内部有 phase + settledDay 守卫，连点只生效一次
      advance(g);
      break;
    case "buy-upgrade":
      buyUpgrade(g, c.defId, c.mode);
      break;
    case "repair":
      repair(g, c.station);
      break;
    case "preorder":
      preorder(g, c.ingredient);
      break;
    case "new-campaign":
      newCampaign(g);
      break;
  }
}
