# Grimorio — developer Makefile
# Thin wrappers over the pnpm workspace scripts (root + backend + frontend).
# Run `make` or `make help` to list targets.

# Use bash with strict flags for recipe lines.
SHELL := /bin/bash
.DEFAULT_GOAL := help

# Backend with no DATABASE_URL uses in-memory adapters (great for local dev).
# Override per-invocation, e.g.  make dev DATABASE_URL=postgres://...
PORT ?= 3000

.PHONY: help setup dev dev-backend dev-frontend build test lint typecheck check format clean reset

help: ## Show this help
	@echo "Grimorio — make targets:"
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Env vars (optional): DATABASE_URL (Postgres; in-memory if unset),"
	@echo "  SESSION_SECRET, CORS_ORIGIN, PORT, VITE_API_URL (frontend → backend)."

setup: ## Install all workspace dependencies (run once after cloning)
	pnpm install

dev: ## Run backend (:$(PORT)) and frontend (:5173) together — Ctrl-C stops both
	@echo "Backend → http://localhost:$(PORT)   Frontend → http://localhost:5173"
	@$(MAKE) -j2 dev-backend dev-frontend

dev-backend: ## Run only the backend API (hot reload)
	PORT=$(PORT) pnpm -C backend dev

dev-frontend: ## Run only the frontend (Vite dev server)
	pnpm -C frontend dev

build: ## Type-check + production build (frontend bundle)
	pnpm -C frontend build

test: ## Run the full test suite (shared + backend + frontend)
	pnpm test

lint: ## Lint the whole workspace
	pnpm lint

typecheck: ## Type-check every package
	pnpm typecheck

check: lint typecheck test ## Everything CI would run: lint + typecheck + tests

format: ## Auto-format with Prettier
	pnpm format

clean: ## Remove build output
	rm -rf frontend/dist

reset: ## Remove all node_modules and build output (then run `make setup`)
	rm -rf node_modules */node_modules frontend/dist
