export type RecipeId = "steak" | "pasta" | "salad";
export type Ingredient = "beef" | "noodle" | "greens";
export type Station = "pan" | "pot";
export type Phase = "briefing" | "serving" | "closed" | "bankrupt" | "finished";
export type EntryKind =
  | "sale"
  | "waste"
  | "miss"
  | "supply"
  | "bonus"
  | "preorder"
  | "install"
  | "repair";
export interface Recipe {
  id: RecipeId;
  name: string;
  icon: string;
  ingredient: Ingredient;
  station: Station;
  target: number;
  price: number;
}
export interface Order {
  id: number;
  recipe: RecipeId;
  guest: string;
  arrived: number;
  deadline: number;
  status: "waiting" | "accepted" | "served" | "left";
}
export interface Portion {
  id: number;
  recipe: RecipeId;
  preparedAt: number;
}
export interface Stove {
  id: number;
  kind: Station;
  portion: Portion | null;
  started: number;
  tier: number;
  wear: number;
}
export interface Dish {
  id: number;
  recipe: RecipeId;
  quality: number;
  cookedAt: number;
  stage: "counter" | "plated";
}
export interface Entry {
  id: number;
  day: number;
  time: number;
  label: string;
  amount: number;
  kind: EntryKind;
}
export interface Goal {
  kind: "served" | "net";
  amount: number;
  label: string;
}
export interface DayPlan {
  day: number;
  title: string;
  brief: string;
  spawnEvery: number;
  spawnUntil: number;
  patience: number;
  maxActive: number;
  weights: Record<RecipeId, number>;
  goal: Goal;
  bonus: number;
}
export interface PendingUpgrade {
  id: number;
  defId: string;
  name: string;
  station: Station;
  toTier: number;
  cost: number;
  downtimeHours: number;
  downtimeSec: number;
  mode: "now" | "later";
  effectiveDay: number;
  openingDelaySec: number;
}
export interface DayRecord {
  day: number;
  title: string;
  sales: number;
  bonus: number;
  cost: number;
  net: number;
  investSpend: number;
  cashEnd: number;
  served: number;
  missed: number;
  goalLabel: string;
  goalMet: boolean;
  openingNote: string[];
  decisions: string[];
}
export interface Game {
  phase: Phase;
  day: number;
  cash: number;
  best: number;
  campaignBest: number;
  history: DayRecord[];
  pendingUpgrades: PendingUpgrade[];
  preorders: Record<Ingredient, number>;
  practice: boolean;
  rngState: number;
  openingNotes: string[];
  settledDay: number;
  nextSpawnAt: number;
  openingDelaySec: number;
  /** 当天正式开门前的安全快照，营业中刷新时整局回滚到这里 */
  briefingSnapshot: unknown;
  time: number;
  duration: number;
  running: boolean;
  ended: boolean;
  nextId: number;
  selectedOrder: number | null;
  selectedDish: number | null;
  orders: Order[];
  stock: Record<Ingredient, number>;
  portions: Portion[];
  stoves: Stove[];
  dishes: Dish[];
  entries: Entry[];
  combo: number;
  served: number;
  missed: number;
  notice: string;
}
export type Command =
  | { type: "accept"; id: number }
  | { type: "select-order"; id: number }
  | { type: "prepare"; recipe: RecipeId }
  | { type: "cook"; portion: number; stove: number }
  | { type: "lift"; id: number }
  | { type: "plate"; id: number }
  | { type: "select-dish"; id: number }
  | { type: "serve" }
  | { type: "discard"; id: number }
  | { type: "restock"; ingredient: Ingredient }
  | { type: "start-day"; practice: boolean }
  | { type: "retry-practice" }
  | { type: "exit-practice" }
  | { type: "buy-upgrade"; defId: string; mode: "now" | "later" }
  | { type: "repair"; station: Station }
  | { type: "preorder"; ingredient: Ingredient }
  | { type: "advance" }
  | { type: "new-campaign" };
