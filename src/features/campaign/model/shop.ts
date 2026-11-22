import type { Game, Station, Ingredient, PendingUpgrade } from "../../../shared/types";
import {
  upgradeFor,
  upgrades,
  REPAIR_COST,
  PREORDER_BATCH,
  PREORDER_DISCOUNT,
  STOCK_CAP,
  INSTALL_HOURS,
  INSTALL_DELAY_SEC,
  MAX_TIER,
  ingredients,
} from "../../../shared/catalog";
import { cashEntry } from "../lib/money";
import { saveCampaign } from "../lib/persistence";

export function stationTier(g: Game, station: Station): number {
  return Math.max(...g.stoves.filter((s) => s.kind === station).map((s) => s.tier));
}

/** 仅在正式打烊后的商店阶段开放，练习模式买不了任何东西 */
function shopOpen(g: Game): boolean {
  return g.phase === "closed" && !g.practice;
}

export function buyUpgrade(g: Game, defId: string, mode: "now" | "later") {
  if (!shopOpen(g)) {
    g.notice = "只有正式打烊后才能升级设备";
    return;
  }
  const def = upgrades.find((u) => u.id === defId);
  if (!def) return;
  const tier = stationTier(g, def.station);
  if (tier >= MAX_TIER) {
    g.notice = "该设备已经是最高等级";
    return;
  }
  if (def.toTier !== tier + 1) {
    g.notice = "需要按等级逐级升级";
    return;
  }
  if (g.pendingUpgrades.some((u) => u.station === def.station)) {
    g.notice = "这台设备已有待安装的升级，先等它就位";
    return;
  }
  if (g.cash < def.cost) {
    g.notice = `现金不足，升级需要 ¥${def.cost}`;
    return;
  }
  const order: PendingUpgrade = {
    id: g.nextId++,
    defId: def.id,
    name: def.name,
    station: def.station,
    toTier: def.toTier,
    cost: def.cost,
    downtimeHours: INSTALL_HOURS,
    downtimeSec: INSTALL_DELAY_SEC,
    mode,
    // 立即安装：连夜施工，次日生效但晚开门；延后：次日仍用旧设备，后日生效
    effectiveDay: mode === "now" ? g.day + 1 : g.day + 2,
    openingDelaySec: mode === "now" ? INSTALL_DELAY_SEC : 0,
  };
  g.pendingUpgrades.push(order);
  cashEntry(
    g,
    `购入${def.station === "pan" ? "煎锅" : "汤锅"}升级「${def.name}」· ${
      mode === "now" ? "立即安装" : "延后安装"
    }`,
    -def.cost,
    "install",
  );
  g.notice =
    mode === "now"
      ? `已付款并连夜安装，明天将晚开门 ${INSTALL_DELAY_SEC} 秒`
      : "已付款，明天继续使用旧设备，后天凌晨自动换装";
  saveCampaign(g);
}

export function repair(g: Game, station: Station) {
  if (!shopOpen(g)) {
    g.notice = "只有正式打烊后才能维护设备";
    return;
  }
  const targets = g.stoves.filter((s) => s.kind === station && s.wear >= 0.5);
  if (!targets.length) {
    g.notice = "这组灶台状态良好，不需要维护";
    return;
  }
  if (g.cash < REPAIR_COST) {
    g.notice = `现金不足，维护需要 ¥${REPAIR_COST}`;
    return;
  }
  targets.forEach((s) => (s.wear = 0));
  cashEntry(
    g,
    `灶台维护 · ${station === "pan" ? "煎锅组" : "汤锅组"}`,
    -REPAIR_COST,
    "repair",
  );
  g.notice = "维护完成，灶台损耗清零，明天起锅品质恢复";
  saveCampaign(g);
}

export function preorder(g: Game, ingredient: Ingredient) {
  if (!shopOpen(g)) {
    g.notice = "只有正式打烊后才能预购次日原料";
    return;
  }
  if (g.preorders[ingredient] + PREORDER_BATCH > STOCK_CAP) {
    g.notice = `预购后总量不能超过库存上限 ${STOCK_CAP} 份`;
    return;
  }
  const unit = ingredients[ingredient].cost - PREORDER_DISCOUNT;
  const total = unit * PREORDER_BATCH;
  if (g.cash < total) {
    g.notice = `现金不足，这批预购需要 ¥${total}`;
    return;
  }
  g.preorders[ingredient] += PREORDER_BATCH;
  cashEntry(
    g,
    `预购次日${ingredients[ingredient].name} ×${PREORDER_BATCH}（优惠价）`,
    -total,
    "preorder",
  );
  g.notice = `已预购，明早开门前自动到货，共 ¥${total}`;
  saveCampaign(g);
}

export function nextUpgradeOf(g: Game, station: Station) {
  return upgradeFor(station, stationTier(g, station));
}
