import type { AIRecommendation } from '../types/aiRecommendation'

export const mockAIRecommendations: AIRecommendation[] = [
  {
    id: 'rec_001',
    name: 'Grilled Salmon Power Bowl',
    reason: 'A balanced dinner with lean protein and steady carbohydrates for recovery after training.',
    tags: ['High Protein', 'Omega-3', 'Balanced'],
    calories: 520,
    protein: 38,
    carbs: 42,
    fat: 18,
    confidence: 92,
    suggestedMeals: [
      { type: 'breakfast', content: 'Greek yogurt with berries and granola' },
      { type: 'lunch', content: 'Chicken quinoa bowl with mixed greens' },
      { type: 'dinner', content: 'Grilled salmon power bowl' },
    ],
  },
  {
    id: 'rec_002',
    name: 'Chicken Quinoa Salad',
    reason: 'Light enough for the evening while still supporting muscle repair with enough protein.',
    tags: ['Low Carb', 'High Protein', 'Light'],
    calories: 450,
    protein: 35,
    carbs: 32,
    fat: 15,
    confidence: 88,
    suggestedMeals: [
      { type: 'breakfast', content: 'Egg white wrap with spinach' },
      { type: 'lunch', content: 'Chicken quinoa salad' },
      { type: 'dinner', content: 'Seared chicken and vegetable plate' },
    ],
  },
  {
    id: 'rec_003',
    name: 'Tofu Soba Recovery Plate',
    reason: 'A plant-forward choice with moderate carbs and a clean protein source.',
    tags: ['Plant Based', 'Moderate Carb', 'Recovery'],
    calories: 480,
    protein: 28,
    carbs: 56,
    fat: 14,
    confidence: 84,
    suggestedMeals: [
      { type: 'breakfast', content: 'Overnight oats and almond butter' },
      { type: 'lunch', content: 'Tofu soba recovery plate' },
      { type: 'dinner', content: 'Baked tofu with soba and vegetables' },
    ],
  },
]
