# Meal App

This repository contains two apps that are intended to run together during development:

- `meal_back`: Go + Gin API with Postgres, started through Docker Compose.
- `meal_front`: Vue 3 + Vite frontend.

## How the two apps connect

The backend serves the API at:

```text
http://localhost:8080/api/v1
```

The frontend uses `VITE_API_BASE_URL=/api/v1` by default. In development, Vite proxies `/api/v1` to `http://localhost:8080`, so browser requests avoid CORS issues.

## First-time setup

Prerequisites:

- Docker Engine or Docker Desktop
- Docker Compose v2 (`docker compose`)
- Node.js and npm

Run:

```bash
make setup
```

This prepares the backend Docker environment and installs frontend dependencies with `npm ci`.

## Run frontend and backend together

```bash
make dev
```

This starts the backend API and Postgres in the background, then starts the frontend dev server.

Open the frontend URL printed by Vite, usually:

```text
http://localhost:5173
```

## Common commands

```bash
make backend-up    # start backend API + Postgres in background
make backend-logs  # stream backend logs
make backend-ps    # check backend container status
make backend-down  # stop backend containers
make frontend-dev  # run only the frontend dev server
make build         # build frontend
make test          # run backend tests in Docker
```

## Environment notes

Frontend environment example:

```bash
cp meal_front/.env.example meal_front/.env
```

For local development, keep:

```env
VITE_API_BASE_URL=/api/v1
```

Only use a full backend URL, such as `http://localhost:8080/api/v1`, when you intentionally want to bypass the Vite proxy.
