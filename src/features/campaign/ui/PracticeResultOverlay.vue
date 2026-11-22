<script setup lang="ts">
import type { Game, Command } from "../../../shared/types";
import { grade } from "../../ledger";
import { dayTotals } from "../lib/money";
defineProps<{ game: Game }>();
defineEmits<{ command: [cmd: Command] }>();
</script>
<template>
  <div v-if="game.phase === 'closed' && game.practice" class="overlay">
    <section class="modal result">
      <span class="eyebrow">PRACTICE RUN · 练习结算</span>
      <div class="grade">{{ grade(game) }}</div>
      <h2>练习打烊，成绩不计入正式经营</h2>
      <p>
        模拟净额 <b>¥{{ dayTotals(game).net }}</b>
        （现金、库存和设备都没有真正变化）
      </p>
      <p>完成 {{ game.served }} 单 · 离店 {{ game.missed }} 位</p>
      <div class="modal-actions">
        <button @click="$emit('command', { type: 'retry-practice' })">
          再练一次 ↻
        </button>
        <button class="soft" @click="$emit('command', { type: 'exit-practice' })">
          返回今日简报
        </button>
      </div>
    </section>
  </div>
</template>
