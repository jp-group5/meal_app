<template>
  <div class="graph-panel">
    <div v-if="loading" class="loading">
      データを取得中...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="nutritionData" class="charts-container">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fetchWeeklyNutrition } from '@/services/nutritionApi';
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

const loading = ref(true);
const error = ref<string | null>(null);
const nutritionData = ref<WeeklyNutritionResponse | null>(null);

// コンポーネントマウント時にデータ取得
onMounted(async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // APIからモックデータを取得 (現在は固定の日付を指定)
    const data = await fetchWeeklyNutrition('2026-05-06', '2026-05-12');
    nutritionData.value = data;
  } catch (err) {
    error.value = 'データの取得に失敗しました';
    console.error(err);
  } finally {
    loading.value = false;
  }
});

// グラフの共通オプション
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

// --- チャートデータの計算 (computed) ---

// 日付ラベル共通 (例: 5/6, 5/7...)
const labels = computed(() => {
  return nutritionData.value?.daily_data.map(d => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }) || [];
});

const caloriesChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'カロリー (kcal)',
      backgroundColor: '#f87979',
      data: nutritionData.value?.daily_data.map(d => d.total_calories) || []
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
      data: nutritionData.value?.daily_data.map(d => d.total_protein) || []
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
      data: nutritionData.value?.daily_data.map(d => d.total_fat) || []
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
      data: nutritionData.value?.daily_data.map(d => d.total_carbs) || []
    }
  ]
}));
</script>

<style scoped>
.graph-panel {
  /* サイドバーに収まるようパディングを少し小さく */
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  /* はみ出し防止の最重要プロパティ */
  min-width: 0;
  width: 100%;
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