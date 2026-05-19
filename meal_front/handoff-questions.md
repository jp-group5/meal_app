# AI Decision Dashboard 連携確認リスト

## Member 2：Backend AI Specialist への確認事項

AI 推薦 API について、以下の内容を確認したいです。

1. AI 推薦を取得する API endpoint は何ですか？

   例：

   ```text
   GET /api/ai/recommendations?date=2026-04-27
   ```

2. 推薦 API が返す JSON 形式はどのようになりますか？

   現在、フロントエンド側では以下の形式を想定しています。

   ```json
   {
     "recommendations": [
       {
         "id": "rec_001",
         "name": "Grilled Salmon Bowl",
         "reason": "Good protein after strength training.",
         "tags": ["High Protein", "Omega-3"],
         "calories": 520,
         "protein": 38,
         "carbs": 42,
         "fat": 18,
         "confidence": 92
       }
     ]
   }
   ```

3. AI の生成に失敗した場合、どのような error response が返りますか？

4. AI 推薦には breakfast、lunch、dinner などの meal type が含まれますか？それとも、推薦結果は共通で返され、フロントエンド側で Dinner として保存する想定ですか？

## Member 3：Frontend Lead への確認事項

フロントエンドのプロジェクト構成と共通機能について、以下の内容を確認したいです。

1. 私のコンポーネントはどのディレクトリに配置すべきですか？

   現在の提案：

   ```text
   src/components/ai/
   ```

2. プロジェクト内に共通の Axios instance または API helper はありますか？

   ある場合、`src/services/aiRecommendationApi.ts` の mock 呼び出しを、共通の API helper を使う形に置き換えます。

3. `selectedDate` はどの Pinia store から取得すればよいですか？

4. 保存成功後に表示する toast/message 用の共通コンポーネントはありますか？

5. Tailwind CSS または UI component library に関するチーム内ルールはありますか？

## Member 4：Frontend UI - Interactive Timeline への確認事項

AI 推薦を Dinner として保存した後、Timeline をどのように更新するか確認したいです。

1. 私が `Accept as Dinner` をクリックして保存に成功した後、Timeline 側で当日の meals を再取得する必要がありますか？

2. 保存成功後に、こちらから何らかの event を emit する必要がありますか？

   例：

   ```ts
   emit('accepted', meal)
   ```

3. Timeline 側では、保存された meal の完全なデータが必要ですか？それとも、再読み込みの通知だけで十分ですか？
