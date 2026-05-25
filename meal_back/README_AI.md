# テストコード

## 画像分析
### リクエスト形式
POST /api/v1/meals/analyze-image
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

image: sample.jpeg
date: 2026-05-19

### 返り値イメージ
{
  "code": 0,
  "message": "ok",
  "data": {
    "analysis": {
      "contents": ["焼き鮭", "みそ汁", "白米"],
      "total_nutrition": {
        "calories": 490,
        "protein": 27.4,
        "fat": 10.8,
        "carbs": 62.0
      },
      "error": null
    },
    "meal": {
      "id": 10,
      "date": "2026-05-19",
      "content": "焼き鮭, みそ汁, 白米"
    }
  }
}

## 献立提案
### リクエスト形式
POST /api/v1/recommendations
Authorization: Bearer <access_token>
Content-Type: application/json

### 返り値イメージ
{
  "code": 0,
  "message": "ok",
  "data": {
    "date": "2026-05-19",
    "choices": [
      {
        "title": "Option A - 高たんぱくバランス献立",
        "reason": "直近の食事で脂質がやや多いため、たんぱく質を確保しつつ脂質を抑えた内容です。",
        "suggestedMeals": [
          {
            "type": "breakfast",
            "content": "オートミール、ギリシャヨーグルト、ゆで卵、ベリー"
          },
          {
            "type": "lunch",
            "content": "鶏むね肉と玄米のサラダボウル、野菜スープ"
          },
          {
            "type": "dinner",
            "content": "白身魚の蒸し焼き、ブロッコリー、さつまいも、味噌汁"
          }
        ]
      },
      {
        "title": "Option B - 運動後の回復重視献立",
        "reason": "今週は中程度以上の活動があるため、回復に必要なたんぱく質と適度な炭水化物を含めています。",
        "suggestedMeals": [
          {
            "type": "breakfast",
            "content": "卵焼き、納豆、玄米、味噌汁"
          },
          {
            "type": "lunch",
            "content": "鮭と野菜の定食、雑穀米、冷奴"
          },
          {
            "type": "dinner",
            "content": "鶏団子と野菜の鍋、豆腐、少量のうどん"
          }
        ]
      }
    ],
    "prompt_json": {
      "metadata": {
        "generated_at": "2026-05-19T12:00:00+09:00",
        "target_date": "2026-05-19",
        "time_zone": "Asia/Tokyo"
      },
      "user": {
        "user_id": 1,
        "username": "alice",
        "height_cm": 168,
        "weight_kg": 56,
        "fitness_goal": "lose_weight",
        "training_experience": ["fitness", "yoga"],
        "monthly_food_budget": 2500,
        "allergies": ["peanut"],
        "dietary_preferences": ["high_protein"]
      },
      "context": {
        "recent_meals": [],
        "weekly_activities": [],
        "meal_stats": {
          "days_with_meals": 5,
          "total_meal_records": 12,
          "average_daily_calories": 1850,
          "records_with_calories": 10,
          "calories_window_in_days": 7,
          "recent_meals_window_days": 7
        },
        "activity_intensity_stats": {
          "low": 2,
          "medium": 3,
          "high": 1,
          "unknown": 0
        }
      }
    }
  }
}