SHELL := /bin/sh

FRONT_DIR := meal_front
BACK_DIR := meal_back

.PHONY: help setup dev backend-up backend-down backend-logs backend-ps frontend-dev build test

help:
	@echo "Targets:"
	@echo "  make setup        - prepare backend env and install frontend dependencies"
	@echo "  make dev          - start backend in Docker, then run frontend dev server"
	@echo "  make backend-up   - start backend API + Postgres in background"
	@echo "  make backend-down - stop backend containers"
	@echo "  make backend-logs - stream backend logs"
	@echo "  make backend-ps   - show backend container status"
	@echo "  make frontend-dev - run only the Vite frontend"
	@echo "  make build        - build frontend"
	@echo "  make test         - run backend tests"

setup:
	$(MAKE) -C $(BACK_DIR) setup
	cd $(FRONT_DIR) && npm ci

dev:
	$(MAKE) -C $(BACK_DIR) up
	cd $(FRONT_DIR) && npm run dev

backend-up:
	$(MAKE) -C $(BACK_DIR) up

backend-down:
	$(MAKE) -C $(BACK_DIR) down

backend-logs:
	$(MAKE) -C $(BACK_DIR) logs

backend-ps:
	$(MAKE) -C $(BACK_DIR) ps

frontend-dev:
	cd $(FRONT_DIR) && npm run dev

build:
	cd $(FRONT_DIR) && npm run build

test:
	$(MAKE) -C $(BACK_DIR) test
