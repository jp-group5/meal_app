import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const useDateStore = defineStore('date', () => {
  const selectedDate = ref(toDateInputValue(new Date()))

  const selectedMonth = computed(() => selectedDate.value.slice(0, 7))

  function setSelectedDate(date: string) {
    selectedDate.value = date
  }

  function goToday() {
    selectedDate.value = toDateInputValue(new Date())
  }

  return {
    selectedDate,
    selectedMonth,
    setSelectedDate,
    goToday,
  }
})
