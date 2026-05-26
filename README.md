# Meal App Development Manual

This repository contains two applications that are intended to run together during local development:

- `meal_back`: Go + Gin backend API with Postgres.
- `meal_front`: Vue 3 + Vite frontend.

The recommended local workflow is:

```bash
make setup
make dev
```

## 1. Architecture

Local development uses this request flow:

```text
Browser
  -> Vite frontend: http://localhost:5173
  -> /api/v1 requests
  -> Vite proxy
  -> Go backend: http://localhost:8080/api/v1
  -> Postgres container
```

The backend API base URL is:

```text
http://localhost:8080/api/v1
```

The frontend should use:

```env
VITE_API_BASE_URL=/api/v1
```

Do not use `http://localhost:8080/api/v1` in normal local frontend development unless you intentionally want to bypass the Vite proxy.

## 2. Prerequisites

Install these tools before running the project:

- Docker Engine or Docker Desktop
- Docker Compose v2, available as `docker compose`
- Node.js
- npm
- `make`

Check versions:

```bash
docker --version
docker compose version
node --version
npm --version
make --version
```

## 3. First-Time Setup

From the repository root:

```bash
make setup
```

This command does two things:

- Prepares backend Docker environment files under `meal_back`.
- Installs frontend dependencies with `npm ci`.

If setup succeeds, you can start both apps.

## 4. Start Frontend And Backend Together

From the repository root:

```bash
make dev
```

This command:

- Starts backend API and Postgres in Docker in the background.
- Starts the Vite frontend dev server in the foreground.

Open the frontend URL printed by Vite. It is usually:

```text
http://localhost:5173
```

Keep the terminal running while developing. Stop the frontend with `Ctrl+C`.

## 5. Daily Development Workflow

Use this workflow for normal feature development:

```bash
make dev
```

Then in another terminal, if needed:

```bash
make backend-logs
```

Recommended checks during development:

- Open `http://localhost:5173`.
- Register or log in through the frontend.
- Confirm API requests use `/api/v1/...` in the browser network tab.
- Check backend logs if requests fail.

## 6. Useful Commands

```bash
make help
```

Shows all root-level commands.

```bash
make setup
```

Prepare backend environment and install frontend dependencies.

```bash
make dev
```

Start backend in Docker, then start frontend dev server.

```bash
make backend-up
```

Start backend API and Postgres in the background.

```bash
make backend-logs
```

Stream backend container logs.

```bash
make backend-ps
```

Show backend container status.

```bash
make backend-down
```

Stop backend containers while keeping database data.

```bash
make frontend-dev
```

Run only the frontend dev server.

```bash
make build
```

Build the frontend.

```bash
make test
```

Run backend tests inside Docker.

## 7. Frontend Environment

The frontend environment example is:

```bash
meal_front/.env.example
```

To create a local frontend environment file:

```bash
cp meal_front/.env.example meal_front/.env
```

For local development, keep this value:

```env
VITE_API_BASE_URL=/api/v1
```

Why this matters:

- The frontend code sends API requests to `/api/v1`.
- Vite proxies `/api/v1` to `http://localhost:8080`.
- The browser sees same-origin requests, so CORS is avoided.

## 8. Backend Environment

The backend is managed by files under `meal_back`:

- `meal_back/compose.yaml`
- `meal_back/.env.docker.example`
- `meal_back/.env.docker`

Normally, you do not need to edit these manually. `make setup` calls the backend setup script and creates or updates the Docker environment file.

Backend default ports:

```text
API:      localhost:8080
Postgres: localhost:5432
```

If a port is already used, update the relevant value in `meal_back/.env.docker`.

## 9. Verify The Integration

After running:

```bash
make dev
```

Verify backend containers:

```bash
make backend-ps
```

Verify backend logs:

```bash
make backend-logs
```

Verify frontend:

```text
http://localhost:5173
```

A working frontend-to-backend request should look like this in the browser network tab:

```text
/api/v1/login
/api/v1/register
/api/v1/private/me
```

It should not normally look like this during Vite development:

```text
http://localhost:8080/api/v1/login
```

## 10. Stop Services

Stop the frontend:

```text
Ctrl+C
```

Stop backend containers:

```bash
make backend-down
```

This keeps the database volume.

To remove backend containers and database volume, run from `meal_back`:

```bash
cd meal_back
make teardown
```

Use teardown only when you intentionally want to reset local backend data.

## 11. Troubleshooting

### Frontend cannot connect to backend

Check that backend containers are running:

```bash
make backend-ps
```

Check logs:

```bash
make backend-logs
```

Confirm frontend environment:

```env
VITE_API_BASE_URL=/api/v1
```

### Port 8080 is already in use

Change backend API port in:

```text
meal_back/.env.docker
```

Then restart backend:

```bash
make backend-down
make backend-up
```

If you change the backend port away from `8080`, also update the Vite proxy target in:

```text
meal_front/vite.config.ts
```

### Port 5173 is already in use

Vite may automatically choose another port. Use the URL printed by the Vite terminal output.

### Frontend dependencies are missing

Run:

```bash
make setup
```

Or install frontend dependencies only:

```bash
cd meal_front
npm ci
```

### Docker daemon is not running

Start Docker Desktop or Docker Engine, then run:

```bash
make backend-up
```

### Database state is broken

If you can discard local data:

```bash
cd meal_back
make teardown
make up
```

## 12. Project Directory Map

```text
.
├── Makefile              # Root-level development commands
├── README.md             # This manual
├── meal_back             # Backend API and Docker Compose setup
└── meal_front            # Vue frontend
```

Important backend files:

```text
meal_back/main.go
meal_back/compose.yaml
meal_back/Makefile
meal_back/scripts/setup_env.sh
```

Important frontend files:

```text
meal_front/package.json
meal_front/vite.config.ts
meal_front/src/api/request.ts
meal_front/.env.example
```
