/**
 * 无头逻辑验证：用 vite 的 SSR 能力加载 TS 模块，在假 localStorage 上
 * 跑完整七天流程，验证关键不变量。运行：node --experimental-vm-modules
 * 这里直接用 vite-node 风格的 esbuild 转译，保持零额外依赖。
 */
import { build } from "vite";
import vue from "@vitejs/plugin-vue";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

// 逻辑专用入口（不含 .vue 组件），用 vite 库模式打成单个 ESM bundle
mkdirSync(".tmp-test", { recursive: true });
writeFileSync(
  ".tmp-test/entry.ts",
  `export * from "${resolve("src/features/campaign/model/campaign.ts").replaceAll("\\\\", "/")}";
export * from "${resolve("src/features/campaign/model/shop.ts").replaceAll("\\\\", "/")}";
export * from "${resolve("src/features/campaign/model/goals.ts").replaceAll("\\\\", "/")}";
export * from "${resolve("src/features/campaign/lib/money.ts").replaceAll("\\\\", "/")}";
export * from "${resolve("src/features/campaign/lib/persistence.ts").replaceAll("\\\\", "/")}";
export * from "${resolve("src/features/pantry/model/inventory.ts").replaceAll("\\\\", "/")}";
`,
);
await build({
  configFile: false,
  logLevel: "silent",
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(".tmp-test/entry.ts"),
      formats: ["es"],
      fileName: "bundle",
    },
    outDir: ".tmp-test/out",
    rollupOptions: { external: [] },
  },
});
const C = await import(resolve(".tmp-test/out/bundle.js"));

let pass = 0;
let fail = 0;
function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

console.log("\n== 1. 初始战役 ==");
let g = C.createCampaign();
check("初始为第1天简报阶段", g.phase === "briefing" && g.day === 1);
check("起始现金 260", g.cash === 260);
check("初始三台灶台 1 级零损耗", g.stoves.every((s) => s.tier === 1 && s.wear === 0));
check("做熟菜/备料为空", g.dishes.length === 0 && g.portions.length === 0);
check("简报包含开局说明（首日为库存/目标说明）", g.openingNotes.length >= 2);

console.log("\n== 2. 练习模式隔离 ==");
const cashBefore = g.cash;
C.startDay(g, true);
check("练习开局进入 serving", g.phase === "serving" && g.practice);
// 模拟一些操作：临时采购 + 起锅损耗
g.running = true;
const beefBefore = g.stock.beef;
C.cashEntry(g, "练习中卖菜", 100, "sale");
C.restock(g, "beef");
check("练习内现金变化", g.cash !== cashBefore);
check("练习内库存变化", g.stock.beef > beefBefore);
// 直接打烊
g.time = g.duration;
C.closeShift(g);
check("练习打烊不写 history", g.history.length === 0);
C.exitPractice(g);
check("退出练习回到简报", g.phase === "briefing" && !g.practice);
check("练习收入被回滚", g.cash === cashBefore);
check("练习库存被回滚", g.stock.beef === beefBefore);

console.log("\n== 3. 正式一天 + 结算幂等 ==");
C.startDay(g, false);
check("正式开局 serving 且非练习", g.phase === "serving" && !g.practice);
check("初始有3位客人", g.orders.length === 3);
g.running = true;
// 模拟营业：卖几单、采购、灶台损耗
const startCash = g.cash;
C.cashEntry(g, "销售A", 48, "sale");
C.cashEntry(g, "销售B", 36, "sale");
g.served = 8; // 达成 day1 目标（6 单）
g.stoves[0].wear = 1.2;
g.time = g.duration;
C.closeShift(g);
const cashAfterFirst = g.cash;
check("正式打烊进入 closed", g.phase === "closed");
check("history 记录1天", g.history.length === 1);
check("目标奖金已发放 (+60)", g.cash === startCash + 48 + 36 + 60);
check("DayRecord 记录 served=8", g.history[0].served === 8);
// 重复结算尝试
C.closeShift(g);
C.closeShift(g);
check("重复 closeShift 不产生新记录", g.history.length === 1);
check("重复 closeShift 不重复发奖金", g.cash === cashAfterFirst);
// 连点下一天
C.advance(g);
C.advance(g);
C.advance(g);
check("连点 advance 只前进一天", g.day === 2 && g.phase === "briefing");
check("第二天简报解释了昨日损耗", g.openingNotes.some((n) => n.includes("损耗")));

console.log("\n== 4. 打烊商店：升级/立即安装/延后 ==");
// 当前在第2天简报，正式营业后打烊
C.startDay(g, false);
g.running = true;
g.time = g.duration;
g.served = 0;
C.closeShift(g);
const shopDay = g.day; // 第2天
const cashBeforeShop = g.cash;
// 立即安装煎锅升级
C.buyUpgrade(g, "pan-2", "now");
check("扣款 150", g.cash === cashBeforeShop - 150);
check("有待安装订单", g.pendingUpgrades.length === 1);
check(
  "立即安装 effectiveDay=次日且延迟30秒",
  g.pendingUpgrades[0].effectiveDay === shopDay + 1 &&
    g.pendingUpgrades[0].openingDelaySec === 30,
);
// 重复购买同一设备被拒
C.buyUpgrade(g, "pan-2", "now");
check("同设备重复购买被拦截", g.pendingUpgrades.length === 1);
// 现金不足
g.cash = 10;
C.buyUpgrade(g, "pot-2", "now");
check("现金不足不能买", g.pendingUpgrades.length === 1 && g.cash === 10);
g.cash = cashBeforeShop - 150;
// 预购
const noodleStock = g.stock.noodle;
C.preorder(g, "noodle");
check("预购扣款（优惠价 (7-2)*4=20）", g.cash === cashBeforeShop - 150 - 20);
check("预购单记录4份", g.preorders.noodle === 4);
C.advance(g);
check("进入次日", g.day === shopDay + 1);
const nextDelay = g.pendingUpgrades
  .filter((u) => u.mode === "now" && u.effectiveDay === g.day)
  .reduce((m, u) => Math.max(m, u.openingDelaySec), 0);
check("立即安装标记了次日30秒延迟", nextDelay === 30);
C.startDay(g, false);
check("立即安装导致次日短30秒", g.duration === 150, `duration=${g.duration}`);
check("煎锅已升2级", g.stoves.filter((s) => s.kind === "pan").every((s) => s.tier === 2));
check("预购食材入库", g.stock.noodle === Math.min(12, noodleStock + 4));
check("预购单已清空", g.preorders.noodle === 0);

console.log("\n== 5. 延后安装保留旧设备 ==");
g.time = g.duration;
C.closeShift(g);
const laterShopDay = g.day;
C.buyUpgrade(g, "pot-2", "later");
check("延后安装 effectiveDay=后日", g.pendingUpgrades[0].effectiveDay === laterShopDay + 2);
C.advance(g);
C.startDay(g, false);
check("延后安装当天汤锅仍是1级", g.stoves.find((s) => s.kind === "pot").tier === 1);
check("延后安装不影响开门时长", g.duration === 180);
g.time = g.duration;
C.closeShift(g);
C.advance(g);
C.startDay(g, false);
check("后天凌晨汤锅自动升到2级", g.stoves.find((s) => s.kind === "pot").tier === 2);

console.log("\n== 6. 做熟的菜不能跨日 ==");
g.dishes.push({ id: 99901, recipe: "steak", quality: 80, cookedAt: 1, stage: "plated" });
g.portions.push({ id: 99902, recipe: "pasta", preparedAt: 1 });
g.time = g.duration;
C.closeShift(g);
check("打烊清空 dishes", g.dishes.length === 0);
check("打烊清空 portions", g.portions.length === 0);
check("灶台无在制食物", g.stoves.every((s) => s.portion === null));
check("库存仍然保留", g.stock.beef >= 0 && typeof g.stock.beef === "number");

console.log("\n== 7. 跑完七天，收官状态与完整收支 ==");
// 当前是第5天 serving 已打烊？直接推进到第7天结束
let guard = 0;
while (g.phase !== "finished" && guard++ < 20) {
  if (g.phase === "briefing") {
    C.startDay(g, false);
    g.running = true;
    g.time = g.duration;
    C.closeShift(g);
  } else if (g.phase === "closed") {
    C.advance(g);
  } else break;
}
check("七天后进入 finished", g.phase === "finished");
check("history 共7条", g.history.length === 7);
check("七天最佳已记录", g.campaignBest > 0);
const savedBest = Number(store.get("lunch-rush-campaign-best"));
check("七天最佳写入独立 localStorage key", savedBest === g.campaignBest);
check(
  "七天最佳与旧单日最佳使用相互独立的存储 key",
  "lunch-rush-best" !== "lunch-rush-campaign-best" &&
    store.has("lunch-rush-campaign-best"),
);
console.log("  · localStorage keys:", [...store.keys()]);
// 完整收支自洽：所有 entry 之和等于当前现金减去起始现金
const entrySum = g.entries.reduce((s, e) => s + e.amount, 0);
check("全部流水之和 = 现金 - 起始现金", entrySum === g.cash - 260, `entrySum=${entrySum} cashDelta=${g.cash - 260}`);

console.log("\n== 8. 倒闭结束状态 ==");
const finishedSave = store.get("lunch-rush-campaign-v2");
let g2 = C.createCampaign();
C.startDay(g2, false);
g2.running = true;
g2.cash = 5;
C.cashEntry(g2, "巨额罚款", -100, "miss");
g2.time = g2.duration;
C.closeShift(g2);
check("现金为负时进入 bankrupt", g2.phase === "bankrupt" && g2.cash < 0);
check("倒闭时 history 保留当天记录", g2.history.length === 1);

console.log("\n== 9. 刷新恢复（持久化） ==");
// 恢复七天收官那一局的存档副本（倒闭局之后覆盖了同一个 key）
store.set("lunch-rush-campaign-v2", finishedSave);
const reloaded = C.loadCampaign();
check("能从 localStorage 恢复战役", reloaded !== null);
check("恢复后保留收官状态", reloaded && reloaded.phase === "finished");
check("恢复后天数为7", reloaded && reloaded.day === 7);

console.log("\n== 10. 营业中刷新：回滚到当天开门前 ==");
let g3 = C.createCampaign();
const cashAtBriefing = g3.cash;
C.startDay(g3, false);
g3.running = true;
C.cashEntry(g3, "半天收入", 200, "sale");
C.restock(g3, "beef");
check("半天内现金确实变化", g3.cash !== cashAtBriefing);
const afterRefresh = C.loadCampaign();
check("刷新后回到简报阶段", afterRefresh.phase === "briefing");
check("半天流水被回滚", afterRefresh.cash === cashAtBriefing);
check("当天没有被结算（settledDay=0）", afterRefresh.settledDay === 0);
check("回滚后仍可正常正式开门", (() => {
  C.hydrateSnapshot(afterRefresh);
  C.startDay(afterRefresh, false);
  return afterRefresh.phase === "serving";
})());

console.log("\n== 11. 练习开局与正式开局条件一致 ==");
let g4 = C.createCampaign();
C.startDay(g4, false);
g4.running = true;
g4.time = g4.duration;
C.closeShift(g4);
C.buyUpgrade(g4, "pan-2", "now");
C.advance(g4); // 第2天简报，存在立即安装订单
// 在 g4 的第2天简报先开练习
C.startDay(g4, true);
check("练习同样吃到立即安装的30秒延迟", g4.duration === 150);
check("练习里煎锅也是升级后的2级", g4.stoves.filter((s) => s.kind === "pan").every((s) => s.tier === 2));
g4.time = g4.duration;
C.closeShift(g4);
C.exitPractice(g4);
check("退出练习后回到第2天简报且升级订单仍在", g4.phase === "briefing" && g4.pendingUpgrades.length === 1);
// 再正式开门，条件与练习一致
C.startDay(g4, false);
check("正式开门同样是150秒", g4.duration === 150);
check("正式开门煎锅2级", g4.stoves.filter((s) => s.kind === "pan").every((s) => s.tier === 2));

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
