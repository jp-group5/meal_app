package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type aiRecommendationResponse struct {
	Date    string     `json:"date"`
	Choices []aiChoice `json:"choices"`
}

type aiChoice struct {
	Title          string            `json:"title"`
	Reason         string            `json:"reason"`
	Calories       int               `json:"calories"`
	Protein        float64           `json:"protein"`
	Carbs          float64           `json:"carbs"`
	Fat            float64           `json:"fat"`
	SuggestedMeals []aiSuggestedMeal `json:"suggestedMeals"`
}

type aiSuggestedMeal struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}

func (h *NutritionHandler) buildRecommendationWithAI(
	ctx context.Context,
	targetDate time.Time,
	promptData *recommendationPromptData,
	mealType string,
	language string,
) (*aiRecommendationResponse, error) {
	promptJSONBytes, err := json.MarshalIndent(promptData, "", "  ")
	if err != nil {
		return nil, err
	}

	prompt := fmt.Sprintf(`以下のデータをもとに、%s向けのおすすめの食事を3件提案してください。

条件:
- allergies に含まれる食材は絶対に使わない
- dietary_preferences を考慮する
- fitness_goal に合う献立を優先する
- monthly_food_budget を考慮し、現実的な献立にする
- meal_history の days_ago は 0 が当日、1 が前日、2 が2日前を表す
- suggestedMeals には %s の食事だけを入れる
- breakfast/lunch/dinner など他の食事タイミングを混ぜた1日分の献立は返さない
- 各 choice の suggestedMeals は必ず1件だけにする
- suggestedMeals[0].type は必ず "%s" にする
- calories は kcal、protein / carbs / fat は g として、各 choice の食事1件分の推定値を数値で返す
- title、reason、suggestedMeals.content は必ず %s で返す
- 出力はJSONのみ

出力形式:
{
  "date": "YYYY-MM-DD",
  "choices": [
    {
      "title": "string",
      "reason": "string",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "suggestedMeals": [
        {"type":"breakfast|lunch|dinner|snack","content":"string"}
      ]
    }
  ]
}

Here is the context JSON:
%s`, mealType, mealType, mealType, recommendationLanguageName(language), string(promptJSONBytes))

	raw, err := callOpenAIForRecommendation(ctx, prompt, mealType)
	if err != nil {
		return nil, err
	}

	var result aiRecommendationResponse
	if err := json.Unmarshal([]byte(raw), &result); err != nil {
		return nil, fmt.Errorf("failed to parse AI recommendation: %w; raw=%s", err, raw)
	}

	if result.Date == "" {
		result.Date = targetDate.Format(dateLayout)
	}

	if rendered, marshalErr := json.Marshal(result); marshalErr == nil {
		log.Printf("[AI recommendation] %s", string(rendered))
	}

	return &result, nil
}

func callOpenAIForRecommendation(ctx context.Context, prompt string, mealType string) (string, error) {
	apiKey := strings.TrimSpace(os.Getenv("OPENAI_API_KEY"))
	if apiKey == "" {
		return "", errors.New("OPENAI_API_KEY is empty")
	}

	model := strings.TrimSpace(os.Getenv("OPENAI_MODEL"))
	if model == "" {
		model = "gpt-4.1-mini"
	}

	schema := map[string]any{
		"type": "object",
		"properties": map[string]any{
			"date": map[string]any{"type": "string"},
			"choices": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"title":  map[string]any{"type": "string"},
						"reason": map[string]any{"type": "string"},
						"calories": map[string]any{
							"type": "integer",
						},
						"protein": map[string]any{"type": "number"},
						"carbs":   map[string]any{"type": "number"},
						"fat":     map[string]any{"type": "number"},
						"suggestedMeals": map[string]any{
							"type": "array",
							"items": map[string]any{
								"type": "object",
								"properties": map[string]any{
									"type":    map[string]any{"type": "string", "enum": []string{mealType}},
									"content": map[string]any{"type": "string"},
								},
								"additionalProperties": false,
								"required":             []string{"type", "content"},
							},
						},
					},
					"additionalProperties": false,
					"required":             []string{"title", "reason", "calories", "protein", "carbs", "fat", "suggestedMeals"},
				},
			},
		},
		"additionalProperties": false,
		"required":             []string{"date", "choices"},
	}

	body := map[string]any{
		"model": model,
		"input": []any{
			map[string]any{
				"role": "user",
				"content": []any{
					map[string]any{
						"type": "input_text",
						"text": prompt,
					},
				},
			},
		},
		"text": map[string]any{
			"format": map[string]any{
				"type":   "json_schema",
				"name":   "nutrition_recommendation",
				"schema": schema,
				"strict": true,
			},
		},
	}

	b, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.openai.com/v1/responses", bytes.NewReader(b))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 60 * time.Second}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var buf bytes.Buffer
	_, _ = buf.ReadFrom(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("openai api status: %s, body: %s", resp.Status, buf.String())
	}

	var out struct {
		OutputText string `json:"output_text"`
		Output     []struct {
			Content []struct {
				Type string `json:"type"`
				Text string `json:"text"`
			} `json:"content"`
		} `json:"output"`
		Usage struct {
			InputTokens  int `json:"input_tokens"`
			OutputTokens int `json:"output_tokens"`
			TotalTokens  int `json:"total_tokens"`
		} `json:"usage"`
	}

	if err := json.Unmarshal(buf.Bytes(), &out); err != nil {
		return "", err
	}

	log.Printf("[OpenAI usage] input=%d output=%d total=%d",
		out.Usage.InputTokens,
		out.Usage.OutputTokens,
		out.Usage.TotalTokens,
	)

	text := strings.TrimSpace(out.OutputText)
	if text == "" {
		for _, item := range out.Output {
			for _, content := range item.Content {
				if strings.TrimSpace(content.Text) != "" {
					text += content.Text
				}
			}
		}
	}

	if strings.TrimSpace(text) == "" {
		return "", errors.New("openai returned empty output text")
	}

	return text, nil
}
