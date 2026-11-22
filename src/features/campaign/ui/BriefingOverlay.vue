<script setup lang="ts">
import type { Game, Command } from "../../../shared/types";
import { dayPlans } from "../../../shared/catalog";
import { stationTier } from "../model/shop";
defineProps<{ game: Game }>();
defineEmits<{ command: [cmd: Command] }>();
</script>
<template>
  <div v-if="game.phase === 'briefing'" class="overlay">
    <section class="modal briefing">
      <span class="eyebrow">DAY {{ game.day }} / 7 · BRIEFING</span>
      <h2>{{ dayPlans[game.day - 1].title }}</h2>
      <p class="brief-text">{{ dayPlans[game.day - 1].brief }}</p>
      <div class="brief-grid">
        <div class="brief-card">
          <small>来客节奏</small>
          <b>每 {{ dayPlans[game.day - 1].spawnEvery }} 秒一位</b>
          <span>耐心 {{ dayPlans[game.day - 1].patience }} 秒 · 同屏上限
            {{ dayPlans[game.day - 1].maxActive }} 单</span>
        </div>
        <div class="brief-card">
          <small>今日目标</small>
          <b>{{ dayPlans[game.day - 1].goal.label }}</b>
          <span>达成奖金 ¥{{ dayPlans[game.day - 1].bonus }}</span>
        </div>
        <div class="brief-card">
          <small>设备等级</small>
          <b>煎锅 Lv.{{ stationTier(game, "pan") }} · 汤锅 Lv.{{
            stationTier(game, "pot")
          }}</b>
          <span>现金 ¥{{ game.cash }}</span>
        </div>
      </div>
      <div class="opening-notes">
        <strong>昨日决策如何影响今日开局</strong>
        <ul>
          <li v-for="(n, i) in game.openingNotes" :key="i">{{ n }}</li>
        </ul>
      </div>
      <div class="modal-actions">
        <button @click="$emit('command', { type: 'start-day', practice: false })">
          正式开门（只能前进一次）
        </button>
        <button class="soft" @click="$emit('command', { type: 'start-day', practice: true })">
          练习今天（不计收支）
        </button>
      </div>
    </section>
  </div>
</template>
