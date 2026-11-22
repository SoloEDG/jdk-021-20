<script setup lang="ts">
import type { Game, Command, Station, Ingredient } from "../../../shared/types";
import {
  upgrades,
  ingredients,
  REPAIR_COST,
  PREORDER_BATCH,
  PREORDER_DISCOUNT,
  STOCK_CAP,
  MAX_TIER,
  CAMPAIGN_DAYS,
} from "../../../shared/catalog";
import { stationTier, nextUpgradeOf } from "../model/shop";
import { dayTotals } from "../lib/money";
const stations: { id: Station; label: string; icon: string }[] = [
  { id: "pan", label: "煎锅组", icon: "🍳" },
  { id: "pot", label: "汤锅组", icon: "🍲" },
];
const ingredientIds: Ingredient[] = ["beef", "noodle", "greens"];
defineProps<{ game: Game }>();
defineEmits<{ command: [cmd: Command] }>();
function wearOf(g: Game, s: Station) {
  return g.stoves.filter((x) => x.kind === s).map((x) => x.wear);
}
</script>
<template>
  <div v-if="game.phase === 'closed' && !game.practice" class="overlay">
    <section class="modal shop">
      <span class="eyebrow">AFTER CLOSE · 打烊管理</span>
      <h2>今晚的经营决策</h2>
      <p class="brief-text">
        今日净额 <b>¥{{ dayTotals(game).net }}</b> · 当前现金
        <b>¥{{ game.cash }}</b>。升级、维护和预购只在打烊后开放，费用当场扣除。
      </p>

      <div class="shop-block">
        <h3>① 设备升级（安装需停机 4 小时）</h3>
        <div v-for="s in stations" :key="s.id" class="shop-row">
          <div class="shop-info">
            <b>{{ s.icon }} {{ s.label }} · Lv.{{ stationTier(game, s.id) }}</b>
            <span>损耗：{{ wearOf(game, s.id).map((w) => w.toFixed(1)).join(" / ") }}</span>
          </div>
          <template
            v-if="stationTier(game, s.id) < MAX_TIER && nextUpgradeOf(game, s.id)"
          >
            <div class="upgrade-detail">
              <b>{{ nextUpgradeOf(game, s.id)!.name }} · ¥{{
                nextUpgradeOf(game, s.id)!.cost
              }}</b>
              <span>{{ nextUpgradeOf(game, s.id)!.effect }}</span>
            </div>
            <button
              class="tiny"
              :disabled="game.cash < nextUpgradeOf(game, s.id)!.cost"
              @click="
                $emit('command', {
                  type: 'buy-upgrade',
                  defId: nextUpgradeOf(game, s.id)!.id,
                  mode: 'now',
                })
              "
            >
              立即安装<br />明日晚开门30秒
            </button>
            <button
              class="tiny soft"
              :disabled="game.cash < nextUpgradeOf(game, s.id)!.cost"
              @click="
                $emit('command', {
                  type: 'buy-upgrade',
                  defId: nextUpgradeOf(game, s.id)!.id,
                  mode: 'later',
                })
              "
            >
              延后安装<br />保留旧设备能力
            </button>
          </template>
          <span v-else class="muted">已达最高等级</span>
        </div>
        <p v-if="game.pendingUpgrades.length" class="pending-list">
          待安装：<span v-for="u in game.pendingUpgrades" :key="u.id">{{
            u.name
          }}（第{{ u.effectiveDay }}天{{
            u.mode === "now" ? "生效，当日晚开门" : "凌晨换装"
          }}）</span>
        </p>
      </div>

      <div class="shop-block">
        <h3>② 灶台维护（损耗会压低起锅品质）</h3>
        <div v-for="s in stations" :key="'r' + s.id" class="shop-row">
          <div class="shop-info">
            <b>{{ s.label }}维护</b>
            <span>一次性修复本组全部损耗 · ¥{{ REPAIR_COST }}</span>
          </div>
          <button
            class="tiny soft"
            :disabled="game.cash < REPAIR_COST || wearOf(game, s.id).every((w) => w < 0.5)"
            @click="$emit('command', { type: 'repair', station: s.id })"
          >
            维护
          </button>
        </div>
      </div>

      <div class="shop-block">
        <h3>③ 预购次日原料（每份比临时采购便宜 ¥{{ PREORDER_DISCOUNT }}）</h3>
        <div v-for="i in ingredientIds" :key="i" class="shop-row">
          <div class="shop-info">
            <b>{{ ingredients[i].icon }} {{ ingredients[i].name }}</b>
            <span>
              已预购 {{ game.preorders[i] }} / {{ STOCK_CAP }} 份 ·
              ¥{{ ingredients[i].cost - PREORDER_DISCOUNT }}/份
            </span>
          </div>
          <button
            class="tiny soft"
            :disabled="
              game.cash <
                (ingredients[i].cost - PREORDER_DISCOUNT) * PREORDER_BATCH ||
              game.preorders[i] + PREORDER_BATCH > STOCK_CAP
            "
            @click="$emit('command', { type: 'preorder', ingredient: i })"
          >
            +{{ PREORDER_BATCH }} /
            ¥{{ (ingredients[i].cost - PREORDER_DISCOUNT) * PREORDER_BATCH }}
          </button>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="$emit('command', { type: 'advance' })">
          {{ game.day >= CAMPAIGN_DAYS ? "进入收官" : `进入第 ${game.day + 1} 天 →` }}
        </button>
      </div>
    </section>
  </div>
</template>
