package handlers

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type mealImageAnalysis struct {
	Contents       []string      `json:"contents"`
	TotalNutrition mealNutrition `json:"total_nutrition"`
	Error          any           `json:"error"`
}

type mealNutrition struct {
	Calories float64 `json:"calories"`
	Protein  float64 `json:"protein"`
	Fat      float64 `json:"fat"`
	Carbs    float64 `json:"carbs"`
}

func analyzeMealImageWithAI(ctx context.Context, imageBytes []byte) (*mealImageAnalysis, error) {
	raw, err := callOpenAIForMealImage(ctx, imageBytes)
	if err != nil {
		return nil, err
	}

	var analysis mealImageAnalysis
	if err := json.Unmarshal([]byte(raw), &analysis); err != nil {
		return nil, fmt.Errorf("failed to parse meal image analysis: %w; raw=%s", err, raw)
	}

	analysis.Error = nil
	return &analysis, nil
}

func callOpenAIForMealImage(ctx context.Context, imageBytes []byte) (string, error) {
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
			"contents": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "string",
				},
			},
			"total_nutrition": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"calories": map[string]any{"type": "number"},
					"protein":  map[string]any{"type": "number"},
					"fat":      map[string]any{"type": "number"},
					"carbs":    map[string]any{"type": "number"},
				},
				"required": []string{
					"calories",
					"protein",
					"fat",
					"carbs",
				},
				"additionalProperties": false,
			},
			"error": map[string]any{
				"type": "null",
			},
		},
		"required": []string{
			"contents",
			"total_nutrition",
			"error",
		},
		"additionalProperties": false,
	}

	imageBase64 := base64.StdEncoding.EncodeToString(imageBytes)

	body := map[string]any{
		"model": model,
		"input": []any{
			map[string]any{
				"role": "user",
				"content": []any{
					map[string]any{
						"type": "input_text",
						"text": `食事画像を解析してください。
画像に写っている料理名を contents に配列で入れてください。
栄養成分は画像から推定し、合計値を total_nutrition に入れてください。
calories は kcal、protein / fat / carbs は g として数値で返してください。
分からない場合も推定値を入れてください。
返答は指定されたJSON形式のみにしてください。`,
					},
					map[string]any{
						"type":      "input_image",
						"image_url": "data:image/jpeg;base64," + imageBase64,
						"detail":    "high",
					},
				},
			},
		},
		"text": map[string]any{
			"format": map[string]any{
				"type":   "json_schema",
				"name":   "meal_image_analysis",
				"schema": schema,
				"strict": true,
			},
		},
	}

	b, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://api.openai.com/v1/responses",
		bytes.NewReader(b),
	)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 60 * time.Second,
	}

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

	fmt.Printf(
		"[OpenAI usage] meal-image input=%d output=%d total=%d\n",
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