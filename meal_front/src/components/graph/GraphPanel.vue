<template>
  <div class="graph-shell" :class="{ 'is-collapsed': !open }">
    <button
      class="graph-toggle"
      type="button"
      :aria-expanded="open"
      :aria-label="toggleLabel"
      :title="toggleLabel"
      @click="emit('toggle')"
    >
      <span aria-hidden="true">{{ open ? '‹' : '›' }}</span>
    </button>

    <div class="graph-panel" :aria-hidden="!open">
      <div class="charts-container">
        <div class="graph-header">
          <p class="label">Last 7 days</p>
          <strong>{{ rangeLabel }}</strong>
        </div>

        <!-- グラフ群 -->
        <div class="charts-grid">
          <div class="chart-box">
            <Bar :data="caloriesChartData" :options="chartOptions" />
          </div>
          <div class="chart-box">
            <Line :data="proteinChartData" :options="chartOptions" />
          </div>
          <div class="chart-box">
            <Line :data="fatChartData" :options="chartOptions" />
          </div>
          <div class="chart-box">
            <Line :data="carbsChartData" :options="chartOptions" />
          </div>
        </div>

        <!-- 概要 -->
        <div class="summary-cards">
          <div class="card">
            <h4>平均カロリー</h4>
            <p>{{ nutritionData.summary.average_calories }} kcal</p>
          </div>
          <div class="card">
            <h4>平均たんぱく質</h4>
            <p>{{ nutritionData.summary.average_protein }} g</p>
          </div>
          <div class="card">
            <h4>平均脂質</h4>
            <p>{{ nutritionData.summary.average_fat }} g</p>
          </div>
          <div class="card">
            <h4>平均炭水化物</h4>
            <p>{{ nutritionData.summary.average_carbs }} g</p>
          </div>
        </div>

        <p v-if="!hasNutritionRecords" class="empty-text">
          No nutrition records for this date range.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Meal } from '@/types';
import type { WeeklyNutritionResponse } from '@/types/nutrients';

// vue-chartjsの設定
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Line } from 'vue-chartjs';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

const props = withDefaults(
  defineProps<{
    open?: boolean
    meals?: Meal[]
    selectedDate?: string
  }>(),
  {
    open: true,
    meals: () => [],
    selectedDate: '',
  },
);

const emit = defineEmits<{
  toggle: []
}>();

const toggleLabel = computed(() => (props.open ? '栄養グラフを閉じる' : '栄養グラフを開く'));
const weeklyDates = computed(() => getLastSevenDates(props.selectedDate));
const rangeLabel = computed(() => {
  const dates = weeklyDates.value;
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  if (!firstDate || !lastDate) {
    return '';
  }

  return `${formatShortDate(firstDate)} - ${formatShortDate(lastDate)}`;
});

const nutritionData = computed<WeeklyNutritionResponse>(() => {
  const dailyData = weeklyDates.value.map((date) => {
    const meals = props.meals.filter((meal) => meal.date === date);

    return {
      date,
      total_calories: sumMealValue(meals, 'calories'),
      total_protein: sumMealValue(meals, 'protein'),
      total_fat: sumMealValue(meals, 'fat'),
      total_carbs: sumMealValue(meals, 'carbs'),
    };
  });

  const dayCount = dailyData.length || 1;

  return {
    summary: {
      average_calories: roundNutrition(totalByKey(dailyData, 'total_calories') / dayCount),
      average_protein: roundNutrition(totalByKey(dailyData, 'total_protein') / dayCount),
      average_fat: roundNutrition(totalByKey(dailyData, 'total_fat') / dayCount),
      average_carbs: roundNutrition(totalByKey(dailyData, 'total_carbs') / dayCount),
    },
    daily_data: dailyData,
  };
});

const hasNutritionRecords = computed(() =>
  nutritionData.value.daily_data.some(
    (day) =>
      day.total_calories > 0 ||
      day.total_protein > 0 ||
      day.total_fat > 0 ||
      day.total_carbs > 0,
  ),
);

// グラフの共通オプション
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

// --- チャートデータの計算 (computed) ---

// 日付ラベル共通 (例: 5/6, 5/7...)
const labels = computed(() => {
  return nutritionData.value.daily_data.map(d => formatShortDate(d.date));
});

const caloriesChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'カロリー (kcal)',
      backgroundColor: '#f87979',
      data: nutritionData.value.daily_data.map(d => d.total_calories)
    }
  ]
}));

const proteinChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'たんぱく質 (g)',
      backgroundColor: '#73b9f5',
      borderColor: '#73b9f5',
      data: nutritionData.value.daily_data.map(d => d.total_protein)
    }
  ]
}));

const fatChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: '脂質 (g)',
      backgroundColor: '#f5c273',
      borderColor: '#f5c273',
      data: nutritionData.value.daily_data.map(d => d.total_fat)
    }
  ]
}));

const carbsChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: '炭水化物 (g)',
      backgroundColor: '#82d99c',
      borderColor: '#82d99c',
      data: nutritionData.value.daily_data.map(d => d.total_carbs)
    }
  ]
}));

function getLastSevenDates(selectedDate: string) {
  const endDate = parseDateInput(selectedDate) ?? new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - (6 - index));
    return toDateInputValue(date);
  });
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatShortDate(value: string) {
  const date = parseDateInput(value);

  if (!date) {
    return value;
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function sumMealValue(meals: Meal[], key: 'calories' | 'protein' | 'fat' | 'carbs') {
  return roundNutrition(
    meals.reduce((total, meal) => {
      const value = meal[key];
      return typeof value === 'number' && Number.isFinite(value) ? total + value : total;
    }, 0),
  );
}

function totalByKey(
  dailyData: WeeklyNutritionResponse['daily_data'],
  key: 'total_calories' | 'total_protein' | 'total_fat' | 'total_carbs',
) {
  return dailyData.reduce((total, day) => total + day[key], 0);
}

function roundNutrition(value: number) {
  return Math.round(value * 10) / 10;
}
</script>

<style scoped>
.graph-shell {
  position: relative;
  min-width: 0;
  width: 100%;
  min-height: 2.75rem;
}

.graph-toggle {
  position: absolute;
  top: 0.75rem;
  right: -0.95rem;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid #d8dee6;
  border-radius: 999px;
  background: #ffffff;
  color: #1f6f63;
  box-shadow: 0 6px 16px rgba(24, 33, 47, 0.16);
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1;
  padding: 0;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    transform 0.22s ease;
}

.graph-toggle:hover {
  background: #eef8f5;
  color: #17574d;
}

.graph-toggle:focus-visible {
  outline: 3px solid rgba(31, 111, 99, 0.24);
  outline-offset: 2px;
}

.graph-shell.is-collapsed .graph-toggle {
  top: 0.35rem;
  left: 0.35rem;
  right: auto;
}

.graph-panel {
  /* サイドバーに収まるようパディングを少し小さく */
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  /* はみ出し防止の最重要プロパティ */
  min-width: 0;
  width: 100%;
  transform: translateX(0);
  opacity: 1;
  transition:
    transform 0.28s ease,
    opacity 0.2s ease;
}

.graph-shell.is-collapsed .graph-panel {
  pointer-events: none;
  opacity: 0;
  transform: translateX(calc(-100% - 1rem));
}

.graph-header {
  display: grid;
  gap: 0.2rem;
  margin-bottom: 1rem;
}

.graph-header .label {
  margin: 0;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.graph-header strong {
  color: #1f2937;
  font-size: 0.95rem;
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  /* 狭いサイドバーに合わせてフォントサイズを調整 */
  font-size: 1.2rem;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}
.error {
  color: #d32f2f;
}

.empty-text {
  margin: 0.75rem 0 0;
  color: #64748b;
  font-size: 0.85rem;
  text-align: center;
}

.summary-cards {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.card {
  flex: 1 1 45%;
  min-width: 0;
  padding: 0.8rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  text-align: center;
}

.card h4 {
  margin: 0 0 0.5rem 0;
  color: #64748b;
  font-size: 0.75rem;
}

.card p {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #334155;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  /* 親要素からのはみ出しを防止 */
  min-width: 0;
}

.chart-box {
  height: 200px; /* 少し高さを抑える */
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  /* Chart.jsが親要素を突き破るのを防ぐために必須 */
  position: relative;
  min-width: 0;
}

.chart-box h3 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  color: #475569;
  font-size: 1.05rem;
  color: #475569;
}
</style>
