import type {
  Recipe,
  RecipeId,
  Ingredient,
  DayPlan,
  Station,
} from "./types";
export const recipes: Record<RecipeId, Recipe> = {
  steak: {
    id: "steak",
    name: "香煎牛排",
    icon: "🥩",
    ingredient: "beef",
    station: "pan",
    target: 12,
    price: 48,
  },
  pasta: {
    id: "pasta",
    name: "奶油意面",
    icon: "🍝",
    ingredient: "noodle",
    station: "pot",
    target: 10,
    price: 36,
  },
  salad: {
    id: "salad",
    name: "温蔬沙拉",
    icon: "🥗",
    ingredient: "greens",
    station: "pan",
    target: 6,
    price: 28,
  },
};
export const ingredients: Record<
  Ingredient,
  { name: string; icon: string; cost: number }
> = {
  beef: { name: "牛肉", icon: "🥩", cost: 12 },
  noodle: { name: "面条", icon: "🍜", cost: 7 },
  greens: { name: "时蔬", icon: "🥬", cost: 5 },
};
export const recipeList = Object.values(recipes);
export const recipeIds: RecipeId[] = ["steak", "pasta", "salad"];

export const STOCK_CAP = 12;
export const PREORDER_BATCH = 4;
export const PREORDER_DISCOUNT = 2;
export const REPAIR_COST = 30;
export const STARTING_CASH = 260;
export const CAMPAIGN_DAYS = 7;
export const INSTALL_HOURS = 4;
export const INSTALL_DELAY_SEC = 30;
export const MAX_TIER = 3;
export const WEAR_PER_COOK = 0.18;

export interface UpgradeDef {
  id: string;
  station: Station;
  toTier: number;
  name: string;
  cost: number;
  effect: string;
}
export const upgrades: UpgradeDef[] = [
  {
    id: "pan-2",
    station: "pan",
    toTier: 2,
    name: "不粘煎锅",
    cost: 150,
    effect: "最佳火候窗口 ±2 → ±3，操作更从容",
  },
  {
    id: "pan-3",
    station: "pan",
    toTier: 3,
    name: "恒温煎台",
    cost: 260,
    effect: "最佳火候窗口 ±3 → ±4，容错拉满",
  },
  {
    id: "pot-2",
    station: "pot",
    toTier: 2,
    name: "加深汤锅",
    cost: 120,
    effect: "最佳火候窗口 ±2 → ±3，煮面不易翻车",
  },
  {
    id: "pot-3",
    station: "pot",
    toTier: 3,
    name: "温控汤锅",
    cost: 220,
    effect: "最佳火候窗口 ±3 → ±4，高峰期更稳",
  },
];
export function upgradeFor(station: Station, tier: number): UpgradeDef | null {
  return (
    upgrades.find((u) => u.station === station && u.toTier === tier + 1) ??
    null
  );
}

export const dayPlans: DayPlan[] = [
  {
    day: 1,
    title: "周一 · 试营业",
    brief: "街坊捧场的试营业，节奏平缓，菜单需求均衡。目标是熟悉流程、攒下第一笔现金。",
    spawnEvery: 20,
    spawnUntil: 140,
    patience: 65,
    maxActive: 5,
    weights: { steak: 1, pasta: 1, salad: 1 },
    goal: { kind: "served", amount: 6, label: "成功上菜 6 单" },
    bonus: 60,
  },
  {
    day: 2,
    title: "周二 · 轻食日",
    brief: "附近写字楼的轻食热潮，温蔬沙拉和奶油意面更受欢迎，来客也比昨天勤快。",
    spawnEvery: 18,
    spawnUntil: 150,
    patience: 62,
    maxActive: 6,
    weights: { steak: 1, pasta: 2, salad: 2 },
    goal: { kind: "served", amount: 8, label: "成功上菜 8 单" },
    bonus: 70,
  },
  {
    day: 3,
    title: "周三 · 牛排之夜",
    brief: "美食博主带来的牛排之夜，香煎牛排点单占大头。牛肉备货和煎锅火候是今天的胜负手。",
    spawnEvery: 16,
    spawnUntil: 155,
    patience: 58,
    maxActive: 6,
    weights: { steak: 3, pasta: 1, salad: 1 },
    goal: { kind: "net", amount: 220, label: "当日净额达到 ¥220" },
    bonus: 90,
  },
  {
    day: 4,
    title: "周四 · 午市高峰",
    brief: "真正的午市高峰：客人一波接一波，耐心也更短。设备升级的价值今天见分晓。",
    spawnEvery: 14,
    spawnUntil: 160,
    patience: 54,
    maxActive: 7,
    weights: { steak: 2, pasta: 2, salad: 1 },
    goal: { kind: "served", amount: 10, label: "成功上菜 10 单" },
    bonus: 110,
  },
  {
    day: 5,
    title: "周五 · 急脾气客人",
    brief: "周五的客人赶时间，耐心明显变短，翻台速度决定一切。别忘了给疲劳的灶台做维护。",
    spawnEvery: 13,
    spawnUntil: 160,
    patience: 48,
    maxActive: 7,
    weights: { steak: 2, pasta: 2, salad: 2 },
    goal: { kind: "net", amount: 300, label: "当日净额达到 ¥300" },
    bonus: 130,
  },
  {
    day: 6,
    title: "周六 · 爆满周末",
    brief: "周末爆满，客流量全周最高，三类菜都有人点。备料不足会直接被客流吞没。",
    spawnEvery: 11,
    spawnUntil: 165,
    patience: 50,
    maxActive: 8,
    weights: { steak: 2, pasta: 2, salad: 2 },
    goal: { kind: "served", amount: 13, label: "成功上菜 13 单" },
    bonus: 150,
  },
  {
    day: 7,
    title: "周日 · 收官盛宴",
    brief: "最后一天的收官盛宴，客流与要求都是全周顶点。为这一周的经营画上漂亮的句号吧。",
    spawnEvery: 10,
    spawnUntil: 168,
    patience: 46,
    maxActive: 8,
    weights: { steak: 3, pasta: 3, salad: 2 },
    goal: { kind: "net", amount: 380, label: "当日净额达到 ¥380" },
    bonus: 200,
  },
];

/** 确定性伪随机：同一天练习重试，来客顺序保持一致 */
export function rngNext(state: number): [number, number] {
  const s = (state * 1664525 + 1013904223) >>> 0;
  return [s, s / 4294967296];
}
export function weightedRecipe(
  r: number,
  weights: Record<RecipeId, number>,
): RecipeId {
  const total = recipeIds.reduce((s, id) => s + weights[id], 0);
  let acc = r * total;
  for (const id of recipeIds) {
    acc -= weights[id];
    if (acc < 0) return id;
  }
  return "salad";
}
