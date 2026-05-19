<script setup lang="ts">
import type { AIRecommendation } from '../../types/aiRecommendation'

defineProps<{
  recommendation: AIRecommendation
  isAccepting?: boolean
}>()

const emit = defineEmits<{
  accept: [recommendation: AIRecommendation]
}>()
</script>

<template>
  <article class="recommendation-card">
    <div class="recommendation-card-header">
      <div>
        <h3 class="recommendation-name">
          {{ recommendation.name }}
        </h3>
        <p class="recommendation-confidence">
          {{ recommendation.confidence }}% match
        </p>
      </div>

      <button
        class="recommendation-accept-button"
        type="button"
        :disabled="isAccepting"
        @click="emit('accept', recommendation)"
      >
        {{ isAccepting ? 'Saving' : 'Accept as Dinner' }}
      </button>
    </div>

    <div class="recommendation-tags">
      <span v-for="tag in recommendation.tags" :key="tag" class="recommendation-tag">
        {{ tag }}
      </span>
    </div>

    <p class="recommendation-reason">
      {{ recommendation.reason }}
    </p>

    <dl class="recommendation-metrics">
      <div class="recommendation-metric">
        <dt>kcal</dt>
        <dd>{{ recommendation.calories }}</dd>
      </div>
      <div class="recommendation-metric">
        <dt>Protein</dt>
        <dd>{{ recommendation.protein }}g</dd>
      </div>
      <div class="recommendation-metric">
        <dt>Carbs</dt>
        <dd>{{ recommendation.carbs }}g</dd>
      </div>
      <div class="recommendation-metric">
        <dt>Fat</dt>
        <dd>{{ recommendation.fat }}g</dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
.recommendation-card {
  border: 1px solid #d8dee6;
  border-radius: 8px;
  background: #ffffff;
  padding: 1rem;
  transition: border-color 0.18s ease;
}

.recommendation-card:hover {
  border-color: #1f6f63;
}

.recommendation-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.recommendation-name {
  margin: 0;
  font-size: 1rem;
}

.recommendation-confidence {
  margin: 0.3rem 0 0;
  color: #1f6f63;
  font-size: 0.8rem;
  font-weight: 700;
}

.recommendation-accept-button {
  flex-shrink: 0;
}

.recommendation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.8rem;
}

.recommendation-tag {
  border-radius: 999px;
  background: #e8f2ef;
  color: #1f6f63;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.recommendation-reason {
  margin: 0;
  color: #4a5968;
  line-height: 1.5;
  font-size: 0.92rem;
}

.recommendation-metrics {
  margin: 0.9rem 0 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
}

.recommendation-metric {
  margin: 0;
  border-radius: 8px;
  background: #f3f6f9;
  text-align: center;
  padding: 0.55rem 0.4rem;
}

.recommendation-metric dt {
  color: #5c6a78;
  font-size: 0.72rem;
}

.recommendation-metric dd {
  margin: 0.2rem 0 0;
  color: #18212f;
  font-size: 0.84rem;
  font-weight: 700;
}

@media (max-width: 760px) {
  .recommendation-card-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
