#!/bin/sh
set -eu

BASE_URL="${BASE_URL:-http://127.0.0.1:8080/api/v1}"
TARGET_DATE="${TARGET_DATE:-2026-05-12}"
OUTPUT_DIR="${OUTPUT_DIR:-json}"
USERNAME="prompttest$(date +%s)"
PASSWORD="password123"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: missing required command: $1" >&2
    exit 1
  fi
}

post_json() {
  path="$1"
  body="$2"
  curl -sS -X POST "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    -d "$body"
}

authed_json() {
  method="$1"
  path="$2"
  body="$3"
  curl -sS -X "$method" "$BASE_URL$path" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body"
}

require_cmd curl
require_cmd jq

echo "Checking backend health at $BASE_URL ..."
if ! curl -sS "$BASE_URL/private/me" >/dev/null 2>&1; then
  echo "ERROR: backend is not reachable. Start it first with: make run" >&2
  exit 1
fi

REGISTER_RESPONSE="$(post_json "/register" "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\",\"email\":\"$USERNAME@example.com\"}")"
LOGIN_RESPONSE="$(post_json "/login" "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")"

ACCESS_TOKEN="$(printf "%s" "$LOGIN_RESPONSE" | jq -r ".data.access_token")"
if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: login failed"
  echo "$LOGIN_RESPONSE" | jq .
  exit 1
fi

authed_json PUT "/users/me/profile" '{"height_cm":170,"weight_kg":65,"training_experience":["fitness","yoga"],"fitness_goal":"build_muscle","monthly_food_budget":3000}' >/dev/null
authed_json PUT "/users/me/preferences" '{"allergies":["peanut"],"dietary_preferences":["high_protein","quick_prep"]}' >/dev/null
authed_json POST "/meals" "{\"date\":\"$TARGET_DATE\",\"type\":\"breakfast\",\"content\":\"Greek yogurt with oats and berries\",\"calories\":420,\"protein\":28,\"carbs\":52,\"fat\":9}" >/dev/null
authed_json POST "/meals" "{\"date\":\"$TARGET_DATE\",\"type\":\"lunch\",\"content\":\"Chicken brown rice bowl\",\"calories\":650,\"protein\":45,\"carbs\":72,\"fat\":18}" >/dev/null
authed_json POST "/activities" "{\"title\":\"Gym strength training\",\"date\":\"$TARGET_DATE\",\"startTime\":\"18:00\",\"endTime\":\"19:30\",\"intensity\":\"high\"}" >/dev/null

PROMPT_RESPONSE="$(curl -sS "$BASE_URL/recommendations/prompt?date=$TARGET_DATE" -H "Authorization: Bearer $ACCESS_TOKEN")"
RECOMMENDATION_RESPONSE="$(curl -sS -X POST "$BASE_URL/recommendations" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d "{\"date\":\"$TARGET_DATE\"}")"

mkdir -p "$OUTPUT_DIR"
PROMPT_FILE="$OUTPUT_DIR/prompt_${USERNAME}_${TARGET_DATE}.json"
RECOMMENDATION_FILE="$OUTPUT_DIR/recommendation_${USERNAME}_${TARGET_DATE}.json"
printf "%s" "$PROMPT_RESPONSE" | jq ".data" > "$PROMPT_FILE"
printf "%s" "$RECOMMENDATION_RESPONSE" | jq ".data" > "$RECOMMENDATION_FILE"

PROMPT_CHECK="$(printf "%s" "$PROMPT_RESPONSE" | jq -e '
  .code == 0
  and .data.metadata.target_date == "'"$TARGET_DATE"'"
  and (.data.user.allergies | type == "array")
  and (.data.user.allergies | index("peanut") != null)
  and (.data.user.dietary_preferences | type == "array")
  and (.data.user.dietary_preferences | index("high_protein") != null)
  and (.data.context.recent_meals | length) >= 2
  and (.data.context.weekly_activities | length) >= 1
  and .data.context.meal_stats.average_daily_calories == 1070
')"

RECOMMENDATION_CHECK="$(printf "%s" "$RECOMMENDATION_RESPONSE" | jq -e '
  .code == 0
  and .data.choice_count >= 2
  and .data.choice_count <= 4
  and (.data.choices | length) == .data.choice_count
  and .data.prompt_version == "v2"
')"

echo "Prompt check: $PROMPT_CHECK"
echo "Recommendation check: $RECOMMENDATION_CHECK"
echo "Created test user: $(printf "%s" "$REGISTER_RESPONSE" | jq -r ".data.username")"
echo "Saved prompt JSON: $PROMPT_FILE"
echo "Saved recommendation JSON: $RECOMMENDATION_FILE"
echo "OK: prompt_json and recommendation response are valid."
