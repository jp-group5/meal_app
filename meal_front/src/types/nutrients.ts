export interface DailyNutrition {
  date: string;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
}

export interface NutritionSummary {
  average_calories: number;
  average_protein: number;
  average_fat: number;
  average_carbs: number;
}

export interface WeeklyNutritionResponse {
  summary: NutritionSummary;
  daily_data: DailyNutrition[];
}
