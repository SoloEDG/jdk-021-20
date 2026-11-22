import type { Game, Entry, EntryKind } from "../../../shared/types";

/** 所有现金变动都从这里走：即时入账，不存在“结算后领取”这一步 */
export function cashEntry(
  g: Game,
  label: string,
  amount: number,
  kind: EntryKind,
) {
  g.cash += amount;
  g.entries.push({
    id: g.nextId++,
    day: g.day,
    time: g.time,
    label,
    amount,
    kind,
  });
}

export function dayEntries(g: Game, day = g.day): Entry[] {
  return g.entries.filter((e) => e.day === day);
}

export function dayTotals(g: Game, day = g.day) {
  const list = dayEntries(g, day);
  const sales = list
    .filter((e) => e.kind === "sale" || e.kind === "bonus")
    .reduce((s, e) => s + e.amount, 0);
  const cost = -list
    .filter((e) => e.amount < 0)
    .reduce((s, e) => s + e.amount, 0);
  return { net: sales - cost, sales, cost };
}

export function campaignTotals(g: Game) {
  const sales = g.entries
    .filter((e) => e.kind === "sale" || e.kind === "bonus")
    .reduce((s, e) => s + e.amount, 0);
  const cost = -g.entries
    .filter((e) => e.amount < 0)
    .reduce((s, e) => s + e.amount, 0);
  return { net: sales - cost, sales, cost };
}
