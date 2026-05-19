<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, reactive, ref } from 'vue'

import AIDecisionDashboard from '@/components/ai/AIDecisionDashboard.vue'
import GoogleCalendar from '@/components/calendar/GoogleCalendar.vue'
import GraphPanel from '@/components/graph/GraphPanel.vue'
import { useDateStore } from '@/stores/date'
import type { Meal, MealType } from '@/types'

interface CalendarDisplayEvent {
  id: string
  title: string
  date: string
  mealType?: MealType
  start?: string
  end?: string
  description?: string
  location?: string
  htmlLink?: string
}

const LOCAL_MEALS_STORAGE_KEY = 'meal-app-local-meals'
const MOCK_MEAL_DATE = '2026-05-31'

const dateStore = useDateStore()
const { selectedDate, selectedMonth } = storeToRefs(dateStore)

const localMeals = ref<Meal[]>(loadLocalMeals())
const googleEvents = ref<CalendarDisplayEvent[]>([])
const detailDate = ref<string | null>(null)
const isAiDrawerOpen = ref(false)
const formMessage = ref('')

const mealForm = reactive({
  type: 'breakfast' as MealType,
  content: '',
  calories: '',
})

const hasDetailDate = computed(() => Boolean(detailDate.value))
const detailMeals = computed(() => localMeals.value.filter((meal) => meal.date === detailDate.value))
const detailEvents = computed(() => googleEvents.value.filter((event) => event.date === detailDate.value))
const hasDetailMeals = computed(() => detailMeals.value.length > 0)
const hasDetailEvents = computed(() => detailEvents.value.length > 0)

const calendarMealEvents = computed<CalendarDisplayEvent[]>(() =>
  localMeals.value.map((meal) => ({
    id: meal.id,
    title: `${toTitleCase(meal.type)}: ${meal.content}`,
    date: meal.date,
    mealType: meal.type,
    description: meal.calories ? `${meal.calories} kcal` : undefined,
  })),
)

function loadLocalMeals() {
  try {
    const rawMeals = window.localStorage.getItem(LOCAL_MEALS_STORAGE_KEY)

    if (rawMeals) {
      const parsedMeals = JSON.parse(rawMeals) as Meal[]
      return ensureMockMealDate(parsedMeals)
    }
  } catch (error) {
    console.warn('Could not read local meals. Falling back to defaults.', error)
  }

  return ensureMockMealDate([])
}

function ensureMockMealDate(meals: Meal[]) {
  const hasMockDate = meals.some((meal) => meal.date === MOCK_MEAL_DATE)

  if (hasMockDate) {
    return meals
  }

  return [...meals, ...createFallbackMeals(MOCK_MEAL_DATE)]
}

function saveLocalMeals() {
  window.localStorage.setItem(LOCAL_MEALS_STORAGE_KEY, JSON.stringify(localMeals.value))
}

function openDateDetail(date: string) {
  detailDate.value = date
  dateStore.setSelectedDate(date)
  formMessage.value = ''
}

function closeDateDetail() {
  detailDate.value = null
  isAiDrawerOpen.value = false
  formMessage.value = ''
}

function handleCalendarEventsLoaded(events: CalendarDisplayEvent[]) {
  googleEvents.value = events
}

function addMealRecord() {
  formMessage.value = ''

  if (!detailDate.value) {
    return
  }

  const content = mealForm.content.trim()
  const calories = mealForm.calories ? Number(mealForm.calories) : undefined

  if (!content) {
    formMessage.value = 'Please enter meal details.'
    return
  }

  if (calories !== undefined && (!Number.isFinite(calories) || calories < 0)) {
    formMessage.value = 'Please enter a valid calorie value.'
    return
  }

  localMeals.value = [
    {
      id: `local-${Date.now()}`,
      date: detailDate.value,
      type: mealForm.type,
      content,
      calories,
    },
    ...localMeals.value,
  ]

  saveLocalMeals()
  mealForm.content = ''
  mealForm.calories = ''
  formMessage.value = 'Meal record saved locally.'
}

function deleteMealRecord(mealId: string) {
  const meal = localMeals.value.find((item) => item.id === mealId)

  if (!meal || !canDeleteMeal(meal)) {
    return
  }

  const shouldDelete = window.confirm(`Delete "${meal.content}" from ${meal.date}?`)

  if (!shouldDelete) {
    return
  }

  localMeals.value = localMeals.value.filter((item) => item.id !== mealId)
  saveLocalMeals()
  formMessage.value = 'Meal record deleted.'
}

function handleRecommendationAccepted(payload: {
  recommendationId: string
  name: string
  date: string
  calories: number
}) {
  if (payload.date !== detailDate.value) {
    return
  }

  localMeals.value = [
    {
      id: `ai-${payload.recommendationId}-${Date.now()}`,
      date: payload.date,
      type: 'dinner',
      content: payload.name,
      calories: payload.calories,
    },
    ...localMeals.value,
  ]

  saveLocalMeals()
}

function createFallbackMeals(date: string): Meal[] {
  return [
    {
      id: `${date}-breakfast`,
      date,
      type: 'breakfast',
      content: 'Greek Yogurt + Berries',
      calories: 320,
    },
    {
      id: `${date}-lunch`,
      date,
      type: 'lunch',
      content: 'Chicken Brown Rice Bowl',
      calories: 560,
    },
  ]
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function canDeleteMeal(meal: Meal) {
  return meal.id.startsWith('local-') || meal.id.startsWith('ai-')
}
</script>

<template>
  <div class="dashboard-layout">
    <aside class="dashboard-sidebar">
      <GraphPanel />
    </aside>

    <section class="page dashboard-main">
      <div class="page-header">
      <div>
        <p class="eyebrow">Unified Workspace</p>
        <h2>Meal Records + AI Recommendation Workspace</h2>
      </div>

      <div class="toolbar">
        <input
          :value="selectedDate"
          type="date"
          aria-label="Select date"
          @input="dateStore.setSelectedDate(($event.target as HTMLInputElement).value)"
        />
        <button type="button" @click="dateStore.goToday">Today</button>
      </div>
    </div>

    <GoogleCalendar
      :meal-events="calendarMealEvents"
      :selected-date="selectedDate"
      @date-selected="openDateDetail"
      @events-loaded="handleCalendarEventsLoaded"
    />

    <div class="content-grid">
      <section class="panel">
        <p class="label">Current month</p>
        <strong>{{ selectedMonth }}</strong>
      </section>

      <section class="panel">
        <p class="label">Current date</p>
        <strong>{{ selectedDate }}</strong>
      </section>
    </div>

    <section v-if="hasDetailDate" class="detail-page">
      <div class="detail-header">
        <div>
          <p class="eyebrow">Selected Date</p>
          <h3>{{ detailDate }}</h3>
        </div>

        <div class="detail-actions">
          <button type="button" class="button-outline" @click="isAiDrawerOpen = true">Ask AI</button>
          <button type="button" class="button-outline" @click="closeDateDetail">Close</button>
        </div>
      </div>

      <div class="detail-grid">
        <section class="panel">
          <div class="section-header">
            <div>
              <p class="label">Meals</p>
              <h3>Daily meal records</h3>
            </div>
          </div>

          <form class="meal-form" @submit.prevent="addMealRecord">
            <select v-model="mealForm.type" aria-label="Meal type">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>

            <input v-model="mealForm.content" aria-label="Meal details" placeholder="Meal details" />
            <input v-model="mealForm.calories" aria-label="Calories" inputmode="numeric" placeholder="Calories" />
            <button type="submit">Add record</button>
          </form>

          <p v-if="formMessage" class="info-message">{{ formMessage }}</p>

          <ul v-if="hasDetailMeals" class="meal-list">
            <li v-for="meal in detailMeals" :key="meal.id" class="meal-list-item">
              <div>
                <p class="meal-type">{{ meal.type }}</p>
                <p class="meal-content">{{ meal.content }}</p>
              </div>
              <div class="meal-actions">
                <strong class="meal-calories">{{ meal.calories ?? '--' }} kcal</strong>
                <button
                  v-if="canDeleteMeal(meal)"
                  type="button"
                  class="delete-button"
                  @click="deleteMealRecord(meal.id)"
                >
                  Delete
                </button>
              </div>
            </li>
          </ul>

          <p v-else class="subtle-text">No meal records yet.</p>
        </section>

        <section class="panel">
          <div class="section-header">
            <div>
              <p class="label">Calendar</p>
              <h3>Google Calendar activities</h3>
            </div>
          </div>

          <ul v-if="hasDetailEvents" class="activity-list">
            <li v-for="event in detailEvents" :key="event.id" class="activity-item">
              <div>
                <p class="activity-title">{{ event.title }}</p>
                <p v-if="event.start" class="subtle-text">{{ event.start }}</p>
                <p v-if="event.location" class="subtle-text">{{ event.location }}</p>
              </div>
              <a v-if="event.htmlLink" :href="event.htmlLink" target="_blank" rel="noreferrer">Open</a>
            </li>
          </ul>

          <p v-else class="subtle-text">No Google Calendar activities for this date.</p>
        </section>
      </div>
    </section>

    <section v-else class="panel empty-detail">
      <p class="label">Date details</p>
      <strong>Select a date on the calendar to view meals and activities.</strong>
    </section>

    <div v-if="isAiDrawerOpen && detailDate" class="drawer-backdrop" @click.self="isAiDrawerOpen = false">
      <aside class="ai-drawer" aria-label="AI recommendations drawer">
        <div class="drawer-header">
          <div>
            <p class="eyebrow">Ask AI</p>
            <h3>{{ detailDate }}</h3>
          </div>
          <button type="button" class="button-outline" @click="isAiDrawerOpen = false">Close</button>
        </div>

        <AIDecisionDashboard :selected-date="detailDate" @accepted="handleRecommendationAccepted" />
      </aside>
    </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard-main {
  min-width: 0;
}

@media (max-width: 860px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }
}
</style>

<style scoped>
.detail-page {
  display: grid;
  gap: 1rem;
  border: 1px solid #d8dee6;
  border-radius: 8px;
  background: #ffffff;
  padding: 1rem;
}

.detail-header,
.section-header,
.activity-item,
.meal-list-item,
.drawer-header {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: flex-start;
}

.detail-header h3,
.section-header h3,
.drawer-header h3 {
  margin: 0;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
}

.meal-form {
  display: grid;
  grid-template-columns: minmax(120px, 0.75fr) minmax(180px, 1.4fr) minmax(100px, 0.7fr) auto;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

select {
  border: 1px solid #cbd5df;
  border-radius: 6px;
  color: #18212f;
  background: #ffffff;
  padding: 0.62rem 0.75rem;
}

.button-outline {
  border-color: #d8dee6;
  background: #ffffff;
  color: #263241;
}

.button-outline:hover {
  background: #f3f6f9;
}

.info-message {
  margin: 0 0 0.8rem;
  border: 1px solid #b8dbd5;
  border-radius: 8px;
  background: #edf8f6;
  color: #124740;
  padding: 0.6rem 0.75rem;
  font-size: 0.86rem;
}

.subtle-text {
  margin: 0;
  color: #5c6a78;
}

.meal-list,
.activity-list {
  display: grid;
  gap: 0.7rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.meal-list-item,
.activity-item {
  border: 1px solid #d8dee6;
  border-radius: 8px;
  background: #ffffff;
  padding: 0.8rem 0.9rem;
}

.meal-type {
  margin: 0;
  color: #1f6f63;
  text-transform: capitalize;
  font-size: 0.74rem;
  font-weight: 700;
}

.meal-content,
.activity-title {
  margin: 0.22rem 0 0;
}

.activity-title {
  color: #18212f;
  font-weight: 700;
}

.meal-calories {
  color: #263241;
  font-size: 0.95rem;
  white-space: nowrap;
}

.meal-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  align-items: center;
}

.delete-button {
  border-color: #e3b8b8;
  background: #fff5f5;
  color: #8f1d1d;
}

.delete-button:hover {
  background: #fde8e8;
}

.empty-detail strong {
  font-size: 1rem;
}

.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  justify-content: flex-end;
  background: rgb(15 23 42 / 35%);
}

.ai-drawer {
  width: min(720px, 100%);
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid #d8dee6;
  background: #f7f8fa;
  padding: 1rem;
}

.drawer-header {
  margin-bottom: 1rem;
}

@media (max-width: 960px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .meal-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .detail-header,
  .section-header,
  .drawer-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
