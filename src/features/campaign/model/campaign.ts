import type {
  Game,
  Stove,
  Ingredient,
  Order,
  PendingUpgrade,
  DayRecord,
} from "../../../shared/types";
import {
  dayPlans,
  rngNext,
  weightedRecipe,
  STARTING_CASH,
  CAMPAIGN_DAYS,
} from "../../../shared/catalog";

const ingredientIds: Ingredient[] = ["beef", "noodle", "greens"];
import { cashEntry, dayTotals } from "../lib/money";
import {
  clearCampaign,
  readBest,
  readCampaignBest,
  saveBest,
  saveCampaign,
  saveCampaignBest,
} from "../lib/persistence";
import { goalMet } from "./goals";

interface Snapshot {
  day: number;
  cash: number;
  stock: Game["stock"];
  stoves: Stove[];
  pendingUpgrades: PendingUpgrade[];
  preorders: Game["preorders"];
  history: DayRecord[];
  rngState: number;
  openingNotes: string[];
  settledDay: number;
  best: number;
  campaignBest: number;
  entries: Game["entries"];
  nextId: number;
}

let snapshot: Snapshot | null = null;
const guests = ["阿宁", "许小姐", "赵先生", "晓晴", "林小姐", "周先生", "小陈", "老陈"];

function makeStoves(): Stove[] {
  return [
    { id: 1, kind: "pan", portion: null, started: 0, tier: 1, wear: 0 },
    { id: 2, kind: "pan", portion: null, started: 0, tier: 1, wear: 0 },
    { id: 3, kind: "pot", portion: null, started: 0, tier: 1, wear: 0 },
  ];
}

export function createCampaign(): Game {
  const g: Game = {
    phase: "briefing",
    day: 1,
    cash: STARTING_CASH,
    best: readBest(),
    campaignBest: readCampaignBest(),
    history: [],
    pendingUpgrades: [],
    preorders: { beef: 0, noodle: 0, greens: 0 },
    practice: false,
    rngState: (Date.now() % 2_000_000_000) + 1,
    openingNotes: [],
    settledDay: 0,
    nextSpawnAt: 0,
    openingDelaySec: 0,
    briefingSnapshot: null,
    time: 0,
    duration: 180,
    running: false,
    ended: false,
    nextId: 1,
    selectedOrder: null,
    selectedDish: null,
    orders: [],
    stock: { beef: 5, noodle: 5, greens: 6 },
    portions: [],
    stoves: makeStoves(),
    dishes: [],
    entries: [],
    combo: 0,
    served: 0,
    missed: 0,
    notice: "新的一周开始了，先看看今天的经营简报。",
  };
  g.openingNotes = buildOpeningNotes(g);
  takeSnapshot(g);
  return g;
}

function takeSnapshot(g: Game) {
  snapshot = {
    day: g.day,
    cash: g.cash,
    stock: { ...g.stock },
    stoves: g.stoves.map((s) => ({ ...s, portion: null })),
    pendingUpgrades: g.pendingUpgrades.map((u) => ({ ...u })),
    preorders: { ...g.preorders },
    history: g.history.map((h) => ({ ...h })),
    rngState: g.rngState,
    openingNotes: [...g.openingNotes],
    settledDay: g.settledDay,
    best: g.best,
    campaignBest: g.campaignBest,
    entries: g.entries.map((e) => ({ ...e })),
    nextId: g.nextId,
  };
  // 同步进游戏状态：正式局写盘时快照一并持久化，供刷新后回滚
  g.briefingSnapshot = JSON.parse(JSON.stringify(snapshot));
}

function restoreSnapshot(g: Game) {
  if (!snapshot) return;
  g.day = snapshot.day;
  g.cash = snapshot.cash;
  g.stock = { ...snapshot.stock };
  g.stoves = snapshot.stoves.map((s) => ({ ...s, portion: null }));
  g.pendingUpgrades = snapshot.pendingUpgrades.map((u) => ({ ...u }));
  g.preorders = { ...snapshot.preorders };
  g.history = snapshot.history.map((h) => ({ ...h }));
  g.rngState = snapshot.rngState;
  g.openingNotes = [...snapshot.openingNotes];
  g.settledDay = snapshot.settledDay;
  g.best = snapshot.best;
  g.campaignBest = snapshot.campaignBest;
  g.entries = snapshot.entries.map((e) => ({ ...e }));
  g.nextId = snapshot.nextId;
}

/** 从 localStorage 恢复后，用持久化的简报快照重置内存快照 */
export function hydrateSnapshot(g: Game) {
  if (g.briefingSnapshot) snapshot = g.briefingSnapshot as Snapshot;
}

function makeOrder(g: Game, arriveAt: number, seq: number): Order {
  let r: number;
  [g.rngState, r] = rngNext(g.rngState);
  const plan = dayPlans[g.day - 1];
  const recipe = weightedRecipe(r, plan.weights);
  [g.rngState, r] = rngNext(g.rngState);
  const jitter = Math.floor(r * 11) - 5;
  return {
    id: g.nextId++,
    recipe,
    guest: guests[seq % guests.length],
    arrived: arriveAt,
    deadline: arriveAt + plan.patience + jitter,
    status: "waiting",
  };
}

function freshShift(g: Game) {
  g.time = 0;
  g.running = false;
  g.ended = false;
  g.selectedOrder = null;
  g.selectedDish = null;
  g.orders = [];
  g.portions = [];
  g.dishes = [];
  g.combo = 0;
  g.served = 0;
  g.missed = 0;
  g.stoves.forEach((s) => (s.portion = null));
  // 初始三位客人
  for (let i = 0; i < 3; i++) g.orders.push(makeOrder(g, 0, i));
  g.nextSpawnAt = dayPlans[g.day - 1].spawnEvery;
}

function buildOpeningNotes(g: Game): string[] {
  const plan = dayPlans[g.day - 1];
  const notes: string[] = [];
  const prev = g.history.find((h) => h.day === g.day - 1);
  if (prev) {
    notes.push(
      `昨日（${prev.title}）净额 ¥${prev.net}、上菜 ${prev.served} 单、离店 ${prev.missed} 位，今日带着 ¥${prev.cashEnd} 现金开门。`,
    );
    for (const d of prev.decisions) notes.push(d);
    if (prev.goalMet)
      notes.push(`昨日目标「${prev.goalLabel}」已达成，奖金 ¥${prev.bonus} 已落袋。`);
    else
      notes.push(`昨日目标「${prev.goalLabel}」未达成，没有拿到奖金。`);
  }
  for (const u of g.pendingUpgrades) {
    if (u.effectiveDay === g.day)
      notes.push(
        `昨晚安装的「${u.name}」今晨已就位，${u.station === "pan" ? "煎锅" : "汤锅"}升至 ${u.toTier} 级。`,
      );
  }
  const pre = (Object.keys(g.preorders) as Ingredient[]).filter(
    (i) => g.preorders[i] > 0,
  );
  if (pre.length)
    notes.push(
      "昨夜预购的食材今晨到货：" +
        pre
          .map((i) => `${ingredientName(i)} ×${g.preorders[i]}`)
          .join("、") +
        "，已入库且没有额外费用。",
    );
  const kept = (Object.keys(g.stock) as (keyof Game["stock"])[])
    .filter((i) => g.stock[i] > 0)
    .map((i) => `${ingredientName(i)} ×${g.stock[i]}`);
  notes.push(
    kept.length
      ? `跨日保留的库存：${kept.join("、")}。做熟的菜和备料已按卫生规定清零。`
      : "昨日没有剩余库存，所有原料都需要今天采购或来自预购。",
  );
  const tired = g.stoves.filter((s) => s.wear >= 1);
  if (tired.length)
    notes.push(
      `${tired.length} 台灶台仍有损耗（起锅品质受影响），今晚打烊后记得安排维护。`,
    );
  notes.push(
    `今日目标：${plan.goal.label}，达成奖励 ¥${plan.bonus}。`,
  );
  return notes;
}

function ingredientName(i: string) {
  return i === "beef" ? "牛肉" : i === "noodle" ? "面条" : "时蔬";
}

function applyDueUpgrades(g: Game) {
  const due = g.pendingUpgrades.filter((u) => u.effectiveDay === g.day);
  for (const u of due) {
    g.stoves
      .filter((s) => s.kind === u.station)
      .forEach((s) => {
        s.tier = u.toTier;
      });
    g.pendingUpgrades = g.pendingUpgrades.filter((x) => x.id !== u.id);
  }
}

/** 开门的共同流程：计算安装延迟、应用到期升级、预购入库、摆好初始台面 */
function applyOpening(g: Game) {
  // 先算延迟再应用升级：applyDueUpgrades 会把已生效订单移出队列
  const delay = g.pendingUpgrades
    .filter((u) => u.mode === "now" && u.effectiveDay === g.day)
    .reduce((m, u) => Math.max(m, u.openingDelaySec), 0);
  applyDueUpgrades(g);
  // 预购到货并入库存，然后清空预购单
  for (const i of ingredientIds) {
    g.stock[i] = Math.min(12, g.stock[i] + g.preorders[i]);
    g.preorders[i] = 0;
  }
  g.openingDelaySec = delay;
  g.duration = 180 - delay;
  freshShift(g);
}

export function startDay(g: Game, practice: boolean) {
  if (g.phase !== "briefing") return;
  g.practice = practice;
  if (practice) {
    // 练习在快照副本上跑，正式资产原封不动
    restoreSnapshot(g);
  }
  applyOpening(g);
  g.phase = "serving";
  g.notice = practice
    ? "练习模式开始：本局收支不会计入正式经营。"
    : g.openingDelaySec
      ? `立即安装占用了清晨时间，今日晚开门 ${g.openingDelaySec} 秒。`
      : "开门营业，客人已经入座。";
  if (!practice) saveCampaign(g);
}

export function closeShift(g: Game) {
  if (g.phase !== "serving") return;
  g.running = false;
  g.ended = true;
  // 做熟的菜、备料、灶上食物一律不能带到明天
  g.portions = [];
  g.dishes = [];
  g.stoves.forEach((s) => (s.portion = null));

  if (g.practice) {
    g.phase = "closed";
    g.notice = "练习打烊：成绩不会计入正式经营，可重试或返回简报。";
    return;
  }

  // 幂等保护：同一天只能正式结算一次
  if (g.settledDay === g.day) return;
  g.settledDay = g.day;

  const plan = dayPlans[g.day - 1];
  const met = goalMet(g, plan.goal);
  let bonus = 0;
  if (met) {
    bonus = plan.bonus;
    cashEntry(g, `目标达成奖金 · ${plan.goal.label}`, bonus, "bonus");
  }
  const after = dayTotals(g, g.day);
  const record: DayRecord = {
    day: g.day,
    title: plan.title,
    sales: after.sales - bonus,
    bonus,
    cost: after.cost,
    net: after.net,
    investSpend: 0,
    cashEnd: g.cash,
    served: g.served,
    missed: g.missed,
    goalLabel: plan.goal.label,
    goalMet: met,
    openingNote: [...g.openingNotes],
    decisions: buildDecisionNotes(g),
  };
  g.history.push(record);
  g.best = Math.max(g.best, after.net);
  saveBest(g.best);

  if (g.cash < 0) {
    g.phase = "bankrupt";
    g.notice = "现金已经透支，餐厅撑不下去了……";
    saveCampaign(g);
    return;
  }
  if (g.day >= CAMPAIGN_DAYS) {
    g.phase = "finished";
    g.campaignBest = Math.max(
      g.campaignBest,
      g.history.reduce((s, h) => s + h.net, 0),
    );
    saveCampaignBest(g.campaignBest);
    g.notice = "第七天打烊，七天经营圆满收官！";
    saveCampaign(g);
    return;
  }
  g.phase = "closed";
  g.notice = "今日打烊。打烊后才能升级设备、维护灶台或预购明日原料。";
  saveCampaign(g);
}

function buildDecisionNotes(g: Game): string[] {
  const out: string[] = [];
  const today = g.entries.filter((e) => e.day === g.day && e.kind === "supply");
  if (today.length)
    out.push(
      `今日临时采购 ${today.length} 次（共 ¥${-today.reduce((s, e) => s + e.amount, 0)}），比预购贵，明天可在打烊后提前备货。`,
    );
  const worn = g.stoves.filter((s) => s.wear >= 1);
  if (worn.length)
    out.push(
      `${worn.length} 台灶台累积了损耗（当前 ${worn.map((s) => `${s.kind === "pan" ? "煎锅" : "汤锅"}${s.id}`).join("、")}），明日起锅品质会打折。`,
    );
  const low = (Object.keys(g.stock) as (keyof Game["stock"])[]).filter(
    (i) => g.stock[i] <= 1,
  );
  if (low.length)
    out.push(
      `收尾时 ${low.map((i) => ingredientName(i)).join("、")} 库存见底，若不预购，明天开门可能断料。`,
    );
  if (g.missed >= 3)
    out.push(`今日有 ${g.missed} 位客人离店，节奏或备料没跟上，明天客流只会更快。`);
  if (!out.length) out.push("今日运营稳健，库存与设备状态都还不错。");
  return out;
}

export function retryPractice(g: Game) {
  if (g.phase !== "closed" || !g.practice) return;
  restoreSnapshot(g);
  g.practice = true;
  applyOpening(g);
  g.phase = "serving";
  g.notice = "已回到今天开门前，重新练习一次。";
}

export function exitPractice(g: Game) {
  if (g.phase !== "closed" || !g.practice) return;
  restoreSnapshot(g);
  g.practice = false;
  g.phase = "briefing";
  g.openingNotes = buildOpeningNotes(g);
  takeSnapshot(g);
  g.notice = "练习结果已丢弃，回到今日正式简报。";
}

export function advance(g: Game) {
  // 阶段守卫 + settledDay 双保险：刷新或连点都不可能重复结算/重复扣费
  if (g.phase !== "closed" || g.practice || g.settledDay !== g.day) return;
  const record = g.history.find((h) => h.day === g.day);
  const invest = -g.entries
    .filter(
      (e) =>
        e.day === g.day &&
        (e.kind === "install" || e.kind === "repair" || e.kind === "preorder"),
    )
    .reduce((s, e) => s + e.amount, 0);
  if (record) {
    record.investSpend = invest;
    record.cashEnd = g.cash;
  }
  g.day += 1;
  g.phase = "briefing";
  g.openingNotes = buildOpeningNotes(g);
  takeSnapshot(g);
  g.notice = `第 ${g.day} 天简报已就绪。`;
  saveCampaign(g);
}

export function newCampaign(g: Game) {
  clearCampaign();
  const fresh = createCampaign();
  Object.assign(g, fresh);
  saveCampaign(g);
}
