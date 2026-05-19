<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RecommendationCard from './RecommendationCard.vue'
import RecommendationSkeleton from './RecommendationSkeleton.vue'
import {
  acceptRecommendationAsMeal,
  fetchAIRecommendations,
} from '../../services/aiRecommendationApi'
import type { AIRecommendation, CreateMealPayload } from '../../types/aiRecommendation'

const props = defineProps<{
  selectedDate: string
}>()

const emit = defineEmits<{
  accepted: [
    payload: {
      recommendationId: string
      name: string
      date: string
      calories: number
    },
  ]
}>()

const recommendations = ref<AIRecommendation[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const acceptingId = ref<string | null>(null)
const successMessage = ref('')

const hasRecommendations = computed(() => recommendations.value.length > 0)

watch(
  () => props.selectedDate,
  () => {
    void loadRecommendations()
  },
  { immediate: true },
)

async function loadRecommendations() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    recommendations.value = await fetchAIRecommendations(props.selectedDate)
  } catch (error) {
    errorMessage.value = 'AI recommendations are unavailable. Please try again later.'
  } finally {
    isLoading.value = false
  }
}

async function handleAccept(recommendation: AIRecommendation) {
  acceptingId.value = recommendation.id
  errorMessage.value = ''
  successMessage.value = ''

  const payload: CreateMealPayload = {
    name: recommendation.name,
    mealType: 'Dinner',
    date: props.selectedDate,
    calories: recommendation.calories,
    protein: recommendation.protein,
    carbs: recommendation.carbs,
    fat: recommendation.fat,
    source: 'ai-recommendation',
    recommendationId: recommendation.id,
  }

  try {
    await acceptRecommendationAsMeal(payload)
    successMessage.value = `${recommendation.name} was added as Dinner.`
    emit('accepted', {
      recommendationId: recommendation.id,
      name: recommendation.name,
      date: props.selectedDate,
      calories: recommendation.calories,
    })
  } catch (error) {
    errorMessage.value = 'Could not save this recommendation. Please try again.'
  } finally {
    acceptingId.value = null
  }
}
</script>

<template>
  <section class="panel ai-dashboard">
      <header class="ai-dashboard-header">
        <div>
          <p class="eyebrow">AI Decision Dashboard</p>
          <h3>Dinner recommendations</h3>
        </div>

        <button
          class="button-outline"
          type="button"
          :disabled="isLoading"
          @click="loadRecommendations"
        >
          Refresh
        </button>
      </header>

      <p v-if="successMessage" class="ai-message ai-message-success">
        {{ successMessage }}
      </p>

      <p v-if="errorMessage" class="ai-message ai-message-error">
        {{ errorMessage }}
      </p>

      <Transition name="fade" mode="out-in">
        <RecommendationSkeleton v-if="isLoading" />

        <TransitionGroup v-else-if="hasRecommendations" name="list" tag="div" class="ai-list">
            <RecommendationCard
              v-for="recommendation in recommendations"
              :key="recommendation.id"
              :recommendation="recommendation"
              :is-accepting="acceptingId === recommendation.id"
              @accept="handleAccept"
            />
        </TransitionGroup>

        <div v-else class="ai-empty">
          <h3>No recommendations yet</h3>
          <p>Refresh after adding meals or activities for this date.</p>
        </div>
      </Transition>
  </section>
</template>

<style scoped>
.ai-dashboard {
  display: grid;
  gap: 0.8rem;
}

.ai-dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}

.ai-dashboard-header h3 {
  margin: 0;
}

.button-outline {
  border-color: #d8dee6;
  background: #ffffff;
  color: #263241;
}

.button-outline:hover {
  background: #f3f6f9;
}

.button-outline:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.ai-message {
  margin: 0;
  border-radius: 8px;
  padding: 0.65rem 0.8rem;
  font-size: 0.86rem;
}

.ai-message-success {
  border: 1px solid #b8dbd5;
  background: #edf8f6;
  color: #124740;
}

.ai-message-error {
  border: 1px solid #efd1d1;
  background: #fdf1f1;
  color: #8f2d2d;
}

.ai-list {
  display: grid;
  gap: 0.8rem;
}

.ai-empty {
  border: 1px dashed #c8d2dd;
  border-radius: 8px;
  background: #ffffff;
  padding: 1rem;
}

.ai-empty h3 {
  margin: 0;
  font-size: 1rem;
}

.ai-empty p {
  margin: 0.5rem 0 0;
  color: #5c6a78;
  font-size: 0.9rem;
}

.fade-enter-active,
.fade-leave-active,
.list-enter-active,
.list-leave-active {
  transition: all 180ms ease;
}

.fade-enter-from,
.fade-leave-to,
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 760px) {
  .ai-dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
