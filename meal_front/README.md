# Member 5 - AI Decision Dashboard 初期作業パッケージ

これは `Member 5: Frontend UI - AI Decision Dashboard` のために準備した、フロントエンドの初期成果物です。

現時点では実際のバックエンドには依存せず、mock データを使って以下の機能を実装しています。

- AI による食事推薦カード
- AI 生成中の Skeleton Loading 表示
- 推薦の取得失敗、または推薦がない場合の基本表示
- `Accept as Dinner` をクリックしたときのフロントエンド側の仮ロジック
- 他メンバーと連携するときに確認すべき項目

## 担当範囲

このモジュールは、AI から受け取った推薦データをユーザーに分かりやすい Dashboard として表示し、ユーザーが推薦された食事をワンクリックで夕食として保存できるようにする部分です。

簡単にまとめると、次の流れを担当します。

```text
AI/Backend から推薦データを受け取る
↓
推薦カードとして表示する
↓
ユーザーが Accept as Dinner をクリックする
↓
バックエンド API を呼び出して Dinner として保存する
```

## ファイル説明

```text
src/components/ai/AIDecisionDashboard.vue
```

AI 推薦エリア全体のコンポーネントです。推薦データの読み込み、loading 状態、エラー状態、空状態、ユーザーが推薦を受け入れたときの処理を担当します。

```text
src/components/ai/RecommendationCard.vue
```

1 つの推薦料理を表示するカードコンポーネントです。料理名、推薦理由、栄養タグ、栄養情報、受け入れボタンを表示します。

```text
src/components/ai/RecommendationSkeleton.vue
```

AI が推薦を生成している間に表示する Skeleton Loading コンポーネントです。

```text
src/mocks/aiRecommendations.ts
```

仮データです。Member 2 から実際の API が提供された後、この mock データを実 API のレスポンスに置き換えます。

```text
src/services/aiRecommendationApi.ts
```

API 接続用の仮ファイルです。現在は mock データを返していますが、後でバックエンド API を呼び出す処理に変更します。

```text
src/types/aiRecommendation.ts
```

TypeScript の型定義です。AI 推薦データや、食事として保存するときに必要なデータ構造を定義しています。

```text
handoff-questions.md
```

他メンバーと作業を連携するときに確認する質問リストです。

```text
prototype.html
```

ブラウザで直接開ける静的プロトタイプです。AI Decision Dashboard の見た目と基本的な操作イメージを素早く共有できます。

## 推奨する開発順序

1. まず `prototype.html` を開いて、全体の見た目を確認する。
2. `src/types/aiRecommendation.ts` を読み、推薦データにどのようなフィールドが必要か確認する。
3. `RecommendationCard.vue` を読み、推薦カードがどのように構成されているか確認する。
4. `AIDecisionDashboard.vue` を読み、loading、データ取得、保存ボタンの処理の関係を理解する。
5. `handoff-questions.md` を使って、Member 2、Member 3、Member 4 と連携内容を確認する。

## Meal Calendar Frontend

AI 食事推薦カレンダーアプリのための Vue 3 + TypeScript フロントエンド基盤です。

## Tech Stack

- Vue 3 Composition API
- Vite
- Vue Router 4
- Pinia
- Axios
- ESLint + Prettier

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Environment

必要に応じて `.env.example` を `.env` にコピーし、バックエンド API の URL を調整します。

```env
VITE_API_BASE_URL=/api/v1
```

说明：

- 开发环境下 Vite 已配置把 `/api/v1` 代理到 `http://localhost:8080`，可避免浏览器跨域问题。
- 若你直接调用远程后端，也可以把 `VITE_API_BASE_URL` 改成完整地址（例如 `http://host:8080/api/v1`）。
