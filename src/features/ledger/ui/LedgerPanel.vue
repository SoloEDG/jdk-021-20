<script setup lang="ts">
import type { Game } from "../../../shared/types";
import { totals } from "../lib/totals";
import { dayEntries } from "../../campaign";
defineProps<{ game: Game }>();
</script>
<template>
  <section class="ledger">
    <div>
      <span class="eyebrow">05 / TODAY'S TAKINGS</span>
      <h2>营业手账</h2>
    </div>
    <div class="ledger-stat">
      <small>今日营业收入</small><b>¥{{ totals(game).sales }}</b>
    </div>
    <div class="ledger-stat">
      <small>今日采购 / 损失</small><b class="red">−¥{{ totals(game).cost }}</b>
    </div>
    <div class="ledger-stat">
      <small>当前现金</small><b :class="{ red: game.cash < 0 }">¥{{ game.cash }}</b>
    </div>
    <div class="ledger-stat">
      <small>成功 / 离店</small
      ><b
        >{{ game.served }} <span class="muted">/ {{ game.missed }}</span></b
      >
    </div>
    <div class="ledger-stat">
      <small>单日最佳 / 七天最佳</small
      ><b>¥{{ game.best }} <span class="muted">/ ¥{{ game.campaignBest }}</span></b
      >
    </div>
    <div class="receipt">
      <div v-for="e in dayEntries(game).slice(-4).reverse()" :key="e.id">
        <span>{{ e.label }}</span
        ><b :class="{ red: e.amount < 0 }">{{
          e.amount >= 0 ? "+" : ""
        }}{{ e.amount }}</b>
      </div>
      <span v-if="!dayEntries(game).length" class="muted"
        >第一笔收入，马上就来。</span
      >
    </div>
  </section>
</template>
