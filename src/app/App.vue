<script setup lang="ts">
import { computed } from "vue";
import { useSession } from "./session";
import { dispatch } from "./commands";
import { OrdersPanel } from "../features/orders";
import { PantryPanel } from "../features/pantry";
import { KitchenPanel } from "../features/kitchen";
import { ServicePanel } from "../features/service";
import { LedgerPanel, totals } from "../features/ledger";
import {
  BriefingOverlay,
  ShopOverlay,
  PracticeResultOverlay,
  CampaignEndOverlay,
  goalProgress,
} from "../features/campaign";
import { dayPlans } from "../shared/catalog";
const { game, toggle, restart } = useSession();
const plan = computed(() => dayPlans[game.day - 1]);
</script>
<template>
  <div class="app-shell">
    <aside class="rail">
      <a class="brand" href="#" aria-label="午市厨房">午<span>市</span></a>
      <div class="rail-line"></div>
      <span class="rail-icon active">♨</span
      ><span class="rail-label">厨房</span>
      <div class="rail-bottom">
        LUNCH<br />RUSH<br /><small>7 DAYS</small>
      </div>
    </aside>
    <main>
      <header>
        <div>
          <div class="eyebrow">LUNCH RUSH / SEVEN-DAY CAMPAIGN</div>
          <h1>午市厨房<span>七天连开，一天天把小店做起来。</span></h1>
        </div>
        <div class="header-actions">
          <span class="day-pill">第 {{ game.day }} / 7 天 · {{ plan.title }}</span>
          <span class="open-dot"></span
          ><span>{{
            game.phase === "serving"
              ? game.running
                ? "正在营业"
                : "已暂停"
              : game.phase === "briefing"
                ? "营业前简报"
                : game.phase === "closed"
                  ? "今日打烊"
                  : "经营结束"
          }}</span
          ><button class="outline" @click="restart">重开整周</button>
        </div>
      </header>
      <div class="hero">
        <div>
          <span class="eyebrow">DAY {{ game.day }} · {{ plan.title }}</span>
          <h2>把忙碌，做成美味。</h2>
          <p>{{ plan.brief }}</p>
          <button
            class="start-button"
            @click="toggle"
            :disabled="game.phase !== 'serving' || game.ended"
          >
            {{
              game.phase !== "serving"
                ? "今日尚未开门"
                : game.running
                  ? "Ⅱ 暂停营业"
                  : game.time
                    ? "▶ 继续营业"
                    : "↗ 开始营业"
            }}
          </button>
          <p v-if="game.practice" class="practice-tag">练习模式 · 收支不计入正式经营</p>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="herb">✦</div>
          <div class="plate-art"><span>🥩</span><i>🥬</i><b>🍅</b></div>
          <span class="art-tag">FRESHLY MADE<br /><b>WITH LOVE</b></span>
        </div>
        <div class="hero-metrics">
          <div>
            <small>今日净收益</small><strong>¥{{ totals(game).net }}</strong>
          </div>
          <div>
            <small>现金（跨日继承）</small><strong>¥{{ game.cash }}</strong>
          </div>
          <div>
            <small>距打烊还有</small
            ><strong
              >{{
                String(
                  Math.floor((game.duration - game.time) / 60),
                ).padStart(2, "0")
              }}<em>:</em
              >{{
                String(Math.floor((game.duration - game.time) % 60)).padStart(
                  2,
                  "0",
                )
              }}</strong
            >
          </div>
          <div class="goal-box">
            <small>今日目标 · {{ plan.goal.label }}</small>
            <div class="goal-track">
              <i
                :style="{
                  width: goalProgress(game, plan.goal).pct + '%',
                }"
              ></i>
            </div>
            <span>{{ goalProgress(game, plan.goal).now }} / {{ plan.goal.amount }}</span>
          </div>
        </div>
      </div>
      <OrdersPanel :game="game" @command="(c) => dispatch(game, c)" />
      <div class="workspace">
        <PantryPanel
          :game="game"
          @command="(c) => dispatch(game, c)"
        /><KitchenPanel
          :game="game"
          @command="(c) => dispatch(game, c)"
        /><ServicePanel :game="game" @command="(c) => dispatch(game, c)" />
      </div>
      <div class="notice" role="status">
        <span>✦ 主厨提示</span>{{ game.notice }}
      </div>
      <LedgerPanel :game="game" />
      <footer>
        好食材，好火候，好心情。<span
          >午市厨房 / LUNCH RUSH · 七天连开的小小餐厅</span
        >
      </footer>
    </main>
    <BriefingOverlay :game="game" @command="(c) => dispatch(game, c)" />
    <ShopOverlay :game="game" @command="(c) => dispatch(game, c)" />
    <PracticeResultOverlay :game="game" @command="(c) => dispatch(game, c)" />
    <CampaignEndOverlay :game="game" @command="(c) => dispatch(game, c)" />
  </div>
</template>
