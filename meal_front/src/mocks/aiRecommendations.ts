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
  },
]

