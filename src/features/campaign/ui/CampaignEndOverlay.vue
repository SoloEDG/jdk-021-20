<script setup lang="ts">
import type { Game, Command } from "../../../shared/types";
import { campaignTotals } from "../lib/money";
import WeekHistoryTable from "./WeekHistoryTable.vue";
defineProps<{ game: Game }>();
defineEmits<{ command: [cmd: Command] }>();
</script>
<template>
  <div
    v-if="game.phase === 'finished' || game.phase === 'bankrupt'"
    class="overlay"
  >
    <section class="modal end-modal">
      <template v-if="game.phase === 'bankrupt'">
        <span class="eyebrow">BANKRUPTCY · 经营终止</span>
        <h2>餐厅倒闭了</h2>
        <p class="brief-text">
          第 {{ game.day }} 天打烊时现金已透支（¥{{ game.cash }}），餐厅无法继续经营。
          以下是到今天为止的完整收支记录。
        </p>
      </template>
      <template v-else>
        <span class="eyebrow">SEVEN DAYS · 圆满收官</span>
        <h2>第七天打烊，七天经营结束</h2>
        <p class="brief-text">
          七天总净额 <b>¥{{ campaignTotals(game).net }}</b>，最终现金
          <b>¥{{ game.cash }}</b>。这是一次完整的七天经营，不是单日成绩。
        </p>
      </template>
      <WeekHistoryTable :game="game" />
      <div class="record-note">
        七天最佳纪录：<b>¥{{ game.campaignBest }}</b
        >· 旧的单日最佳仍独立保留：<b>¥{{ game.best }}</b>
      </div>
      <div class="modal-actions">
        <button @click="$emit('command', { type: 'new-campaign' })">
          开一家新的餐厅 ↗
        </button>
      </div>
    </section>
  </div>
</template>
