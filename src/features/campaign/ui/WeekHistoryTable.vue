<script setup lang="ts">
import type { Game } from "../../../shared/types";
import { campaignTotals } from "../lib/money";
defineProps<{ game: Game }>();
</script>
<template>
  <div class="history-table">
    <table>
      <thead>
        <tr>
          <th>日期</th>
          <th>上菜/离店</th>
          <th>营收</th>
          <th>奖金</th>
          <th>当日成本</th>
          <th>当日净额</th>
          <th>打烊后投入</th>
          <th>日终现金</th>
          <th>目标</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="h in game.history" :key="h.day">
          <td>{{ h.title }}</td>
          <td>{{ h.served }} / {{ h.missed }}</td>
          <td>¥{{ h.sales }}</td>
          <td>¥{{ h.bonus }}</td>
          <td class="red">−¥{{ h.cost }}</td>
          <td><b>¥{{ h.net }}</b></td>
          <td class="muted">−¥{{ h.investSpend }}</td>
          <td>¥{{ h.cashEnd }}</td>
          <td :class="h.goalMet ? 'goal-ok' : 'goal-miss'">
            {{ h.goalMet ? "✓ " : "× " }}{{ h.goalLabel }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5">七天合计</td>
          <td><b>¥{{ campaignTotals(game).net }}</b></td>
          <td colspan="3">
            七天最佳纪录 ¥{{ game.campaignBest }}（单日最佳 ¥{{ game.best }}
            独立保留）
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
