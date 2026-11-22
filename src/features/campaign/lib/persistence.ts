import type { Game } from "../../../shared/types";

const SAVE_KEY = "lunch-rush-campaign-v2";
const BEST_KEY = "lunch-rush-best";
const CAMPAIGN_BEST_KEY = "lunch-rush-campaign-best";

/** 练习模式不写盘：刷新后回到当天正式开局前的快照，练习收入无法落袋 */
export function saveCampaign(g: Game) {
  if (g.practice) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(g));
  } catch {
    g.notice = "浏览器存储不可用，刷新页面可能丢失进度";
  }
}

export function loadCampaign(): Game | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Game;
    if (!data || typeof data.day !== "number" || !data.phase) return null;
    if (data.practice) return null;
    // 营业进行中刷新：当天尚未正式结算，整局回滚到开门前快照，
    // 半天的流水、库存变动全部作废，不可能重复领营业款或重复扣费。
    if (data.phase === "serving" && data.briefingSnapshot) {
      const snap = data.briefingSnapshot as Partial<Game>;
      data.phase = "briefing";
      data.running = false;
      data.ended = false;
      data.time = 0;
      data.orders = [];
      data.portions = [];
      data.dishes = [];
      data.combo = 0;
      data.served = 0;
      data.missed = 0;
      data.selectedOrder = null;
      data.selectedDish = null;
      if (typeof snap.cash === "number") data.cash = snap.cash;
      if (snap.stock) data.stock = snap.stock;
      if (snap.stoves) data.stoves = snap.stoves;
      if (snap.entries) data.entries = snap.entries;
      if (snap.rngState) data.rngState = snap.rngState;
      if (snap.nextId) data.nextId = snap.nextId;
      if (snap.pendingUpgrades) data.pendingUpgrades = snap.pendingUpgrades;
      if (snap.preorders) data.preorders = snap.preorders;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearCampaign() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

/** 旧的单日最佳成绩继续独立保留，绝不冒充七天纪录 */
export function readBest(): number {
  try {
    const v = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) ? Math.max(0, v) : 0;
  } catch {
    return 0;
  }
}
export function saveBest(v: number) {
  try {
    localStorage.setItem(BEST_KEY, String(v));
  } catch {
    /* ignore */
  }
}
export function readCampaignBest(): number {
  try {
    const v = Number(localStorage.getItem(CAMPAIGN_BEST_KEY));
    return Number.isFinite(v) ? Math.max(0, v) : 0;
  } catch {
    return 0;
  }
}
export function saveCampaignBest(v: number) {
  try {
    localStorage.setItem(CAMPAIGN_BEST_KEY, String(v));
  } catch {
    /* ignore */
  }
}
