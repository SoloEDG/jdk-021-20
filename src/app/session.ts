import { reactive, onUnmounted } from "vue";
import {
  createCampaign,
  loadCampaign,
  closeShift,
  saveCampaign,
  hydrateSnapshot,
} from "../features/campaign";
import { expire, arrive, resetGuestSeq } from "../features/orders";
export function useSession() {
  const stored = loadCampaign();
  const game = reactive(stored ?? createCampaign());
  if (stored) hydrateSnapshot(game);
  if (!stored) saveCampaign(game);
  let last = performance.now(),
    carry = 0;
  const timer = setInterval(() => {
    const now = performance.now(),
      dt = Math.min(0.5, (now - last) / 1000);
    last = now;
    if (!game.running || game.phase !== "serving") return;
    carry += dt;
    while (carry >= 0.1 && game.running && game.phase === "serving") {
      carry -= 0.1;
      game.time = Math.min(
        game.duration,
        Math.round((game.time + 0.1) * 10) / 10,
      );
      expire(game);
      arrive(game);
      if (game.time >= game.duration) {
        // closeShift 内部有 phase / settledDay 双保险，定时器重复触发也只结算一次
        closeShift(game);
        if (!game.practice) saveCampaign(game);
      }
    }
  }, 50);
  onUnmounted(() => clearInterval(timer));
  function toggle() {
    if (game.phase !== "serving" || game.ended) return;
    carry = 0;
    last = performance.now();
    game.running = !game.running;
    game.notice = game.running
      ? "营业中，客人已经入座。"
      : "已暂停，所有厨房计时冻结。";
  }
  function restart() {
    // 只允许在简报阶段重开整周，营业中不能用刷新来逃避当天结果
    if (game.phase === "serving") {
      game.notice = "营业中不能重开；正式结算只有一次，练习模式可在简报页进入。";
      return;
    }
    Object.assign(game, createCampaign());
    resetGuestSeq();
    saveCampaign(game);
  }
  return { game, toggle, restart };
}
