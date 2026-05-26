import type { WeeklyNutritionResponse } from '../types/nutrients';

export const mockWeeklyNutrition: WeeklyNutritionResponse = {
  summary: {
    average_calories: 2150,
    average_protein: 75.2,
    average_fat: 60.5,
    average_carbs: 250.0,
  },
  daily_data: [
    {
      date: '2026-05-06',
      total_calories: 2100,
      total_protein: 70.0,
      total_fat: 65.0,
      total_carbs: 240.2,
    },
    {
      date: '2026-05-07',
      total_calories: 2250,
      total_protein: 80.5,
      total_fat: 55.0,
      total_carbs: 260.0,
    },
    {
      date: '2026-05-08',
      total_calories: 1950,
      total_protein: 65.0,
      total_fat: 50.5,
      total_carbs: 220.5,
    },
    {
      date: '2026-05-09',
      total_calories: 2300,
      total_protein: 85.0,
      total_fat: 70.0,
      total_carbs: 280.0,
    },
    {
      date: '2026-05-10',
      total_calories: 2050,
      total_protein: 72.0,
      total_fat: 62.0,
      total_carbs: 235.0,
    },
    {
      date: '2026-05-11',
      total_calories: 2400,
      total_protein: 88.0,
      total_fat: 65.0,
      total_carbs: 290.0,
    },
    {
      date: '2026-05-12',
      total_calories: 2000,
      total_protein: 65.9,
      total_fat: 56.0,
      total_carbs: 224.3,
    },
  ],
};
