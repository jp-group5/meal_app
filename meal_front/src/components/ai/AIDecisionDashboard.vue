<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RecommendationCard from './RecommendationCard.vue'
import RecommendationSkeleton from './RecommendationSkeleton.vue'
import {
  acceptRecommendationAsMeal,
  fetchAIRecommendations,
} from '../../services/aiRecommendationApi'
import type { RecommendationLanguage } from '../../api/recommendation'
import type { MealType } from '../../types'
import type { AIRecommendation, CreateMealPayload } from '../../types/aiRecommendation'

type AISelectableMealType = Extract<MealType, 'breakfast' | 'lunch' | 'dinner'>

const AI_MEAL_TYPES: AISelectableMealType[] = ['breakfast', 'lunch', 'dinner']
const AI_LANGUAGES: Array<{ value: RecommendationLanguage; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: 'Japanese' },
]

const props = withDefaults(
  defineProps<{
    selectedDate: string
    mealType?: MealType
  }>(),
  {
    mealType: 'dinner',
  },
)

const emit = defineEmits<{
  accepted: [
    payload: {
      recommendationId: string
      name: string
      date: string
      mealType: MealType
      calories: number | null
      protein: number | null
      carbs: number | null
      fat: number | null
    },
  ]
}>()

const recommendations = ref<AIRecommendation[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const acceptingId = ref<string | null>(null)
const successMessage = ref('')
const selectedMealType = ref<AISelectableMealType>(normalizeAISelectableMealType(props.mealType))
const selectedLanguage = ref<RecommendationLanguage>('en')

const hasRecommendations = computed(() => recommendations.value.length > 0)
const selectedMealLabel = computed(() => toTitleCase(selectedMealType.value))
const acceptLabel = computed(() => `Save as ${selectedMealLabel.value}`)
const heading = computed(() => `${selectedMealLabel.value} recommendations`)

watch(
  () => props.mealType,
  (mealType) => {
    selectedMealType.value = normalizeAISelectableMealType(mealType)
  },
)

watch(
  () => [props.selectedDate, selectedMealType.value, selectedLanguage.value],
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
    recommendations.value = await fetchAIRecommendations(props.selectedDate, selectedMealType.value, selectedLanguage.value)
  } catch (error) {
    errorMessage.value = getRecommendationErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

async function handleAccept(recommendation: AIRecommendation) {
  acceptingId.value = recommendation.id
  errorMessage.value = ''
  successMessage.value = ''

  const suggestedSelectedMeal = recommendation.suggestedMeals.find((meal) => meal.type === selectedMealType.value)
  const fallbackMeal = recommendation.suggestedMeals[0]
  const selectedMeal = suggestedSelectedMeal ?? fallbackMeal

  if (!selectedMeal) {
    errorMessage.value = 'No meal details to save.'
    acceptingId.value = null
    return
  }

  const payload: CreateMealPayload = {
    content: selectedMeal.content,
    mealType: selectedMealType.value,
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
    successMessage.value = `Saved: ${selectedMeal.content}`
    emit('accepted', {
      recommendationId: recommendation.id,
      name: selectedMeal.content,
      date: props.selectedDate,
      mealType: selectedMealType.value,
      calories: recommendation.calories ?? null,
      protein: recommendation.protein ?? null,
      carbs: recommendation.carbs ?? null,
      fat: recommendation.fat ?? null,
    })
  } catch (error) {
    errorMessage.value = 'Could not save. Please try again.'
  } finally {
    acceptingId.value = null
  }
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function normalizeAISelectableMealType(mealType: MealType): AISelectableMealType {
  return AI_MEAL_TYPES.includes(mealType as AISelectableMealType) ? (mealType as AISelectableMealType) : 'dinner'
}

function getRecommendationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  const bizCode = getBusinessErrorCode(error)

  if (bizCode === 10005 || /auth|authorization|token|login|session/i.test(message)) {
    return 'Please log in to use AI recommendations.'
  }

  return message
    ? `AI is unavailable: ${message}`
    : 'AI is unavailable. Please try again later.'
}

function getBusinessErrorCode(error: unknown) {
  if (typeof error === 'object' && error !== null && 'bizCode' in error) {
    return (error as { bizCode?: number }).bizCode
  }

  return undefined
}
</script>

<template>
  <section class="panel ai-dashboard">
      <header class="ai-dashboard-header">
        <div>
          <p class="eyebrow">AI meals</p>
          <h3>{{ heading }}</h3>
        </div>

        <div class="ai-dashboard-actions">
          <select v-model="selectedMealType" aria-label="Select meal type for AI recommendations">
            <option v-for="mealType in AI_MEAL_TYPES" :key="mealType" :value="mealType">
              {{ toTitleCase(mealType) }}
            </option>
          </select>

          <select v-model="selectedLanguage" aria-label="Select AI recommendation language">
            <option v-for="language in AI_LANGUAGES" :key="language.value" :value="language.value">
              {{ language.label }}
            </option>
          </select>

          <button class="button-outline" type="button" :disabled="isLoading" @click="loadRecommendations">
            Refresh
          </button>
        </div>
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
              :accept-label="acceptLabel"
              @accept="handleAccept"
            />
        </TransitionGroup>

        <div v-else class="ai-empty">
          <h3>No suggestions yet</h3>
          <p>Add context or refresh.</p>
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

.ai-dashboard-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
}

.ai-dashboard-actions select {
  min-width: 8rem;
  border: 1px solid #d8dee6;
  border-radius: 6px;
  background: #ffffff;
  color: #263241;
  padding: 0.56rem 0.7rem;
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
