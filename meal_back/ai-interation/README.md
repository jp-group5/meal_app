# ai-interation (mock scaffold)

## 起動
```bash
go mod tidy
go run ./cmd/api
```

## 画像分析
curl.exe -X POST "http://localhost:8080/api/v1/meal-analysis" -F "image=@sample.jpeg"

## 献立提案
curl.exe -X POST "http://localhost:8080/api/v1/recommendation" `
  -H "Content-Type: application/json" `
  -d "{`"user_id`":`"u12345`",`"target_date`":`"2026-04-28`",`"condition`":`"home_cooking`"}"

## Project Structure

ai-interation/
├── cmd/
│   └── api/
│       └── main.go
└── internal/
    ├── config/
    │   └── config.go
    ├── httpapi/
    │   ├── handler.go
    │   └── router.go
    ├── infra/
    │   ├── openai/
    │   │   └── client.go
    │   └── repository/
    │       └── mock.go
    ├── model/
    │   └── types.go
    └── service/
        └── service.go

## 各ディレクトリの役割

### `cmd/api`

アプリケーションの起動処理を置く場所です。  
Ginサーバーの起動、OpenAIクライアントやrepository、service、handlerの生成を行います。

### `internal/config`

ポート番号などの設定値を読み込みます。

### `internal/httpapi`

HTTPリクエストとHTTPレスポンスを扱います。  
フロントエンドからのリクエストを受け取り、serviceを呼び出して結果をJSONで返します。

### `internal/service`

アプリケーションの中心処理を置きます。  
DBから必要なデータを取得し、AIに渡す入力を組み立て、OpenAIから返ってきた結果を整形します。

### `internal/model`

APIのリクエスト・レスポンスや、DB・AIとのやり取りに使うデータ構造を定義します。

### `internal/infra/openai`

OpenAI APIとの通信処理を行います。

### `internal/infra/repository`

DBアクセス部分を置く場所です。  
現在はDB未接続のため、`mock.go` で固定データを返しています。
