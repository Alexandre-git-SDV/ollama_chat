<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Projet : Ollama Chat

Application de chat local basée sur Ollama : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Mongoose 9 (MongoDB), déployée via Docker.

### Commandes

Le gestionnaire de paquets est **pnpm** — n'utilise jamais npm ni yarn (installation : `pnpm install`, ajout de dépendance : `pnpm add <pkg>`).

- `pnpm dev` — serveur de développement
- `pnpm build` — build de production
- `pnpm lint` — ESLint
- `pnpm test` / `pnpm test:coverage` — Vitest
- `pnpm docker:up:auto` — stack Docker complète (app + MongoDB + Ollama)

### Structure

- `src/app/` — pages et routes API App Router (`api/chat`, `api/conversations`, `api/ollama/health`)
- `src/components/`, `src/hooks/`, `src/lib/`, `src/models/`, `src/types/` — composants, hooks, logique partagée, modèles Mongoose, types
- `tests/` — tests Vitest (Testing Library + jsdom)

### MCP Next.js (next-devtools)

Le projet expose le MCP `next-devtools` (configuré dans `.mcp.json` pour Claude Code et `opencode.json` pour opencode). Quand le serveur de dev tourne (`pnpm dev`), utilise ses outils pour travailler sur l'état réel de l'application :

- `get_errors` — erreurs de build, runtime et typage en temps réel
- `get_routes`, `get_page_metadata`, `get_project_metadata` — routes et structure de l'app
- `get_logs` — logs du serveur de dev et de la console navigateur

Vérifie systématiquement `get_errors` après une modification si le serveur de dev est lancé.

### MCP GitHub

Le projet expose aussi le MCP officiel [`github-mcp-server`](https://github.com/github/github-mcp-server) (serveur distant `https://api.githubcopilot.com/mcp/`, configuré dans `.mcp.json` et `opencode.json`) pour fiabiliser le travail sur les workflows GitHub Actions, Dependabot et le Dependency Review (issues, PR, résultats de checks, alertes) sans dépendre de copier-coller manuel des logs CI. Nécessite une autorisation OAuth ponctuelle côté utilisateur (`/mcp` en session interactive) — aucun token n'est stocké dans le dépôt.

### Sous-agents

Le projet définit sept sous-agents, disponibles dans `.claude/agents/` (Claude Code) et `.opencode/agent/` (opencode). Délègue-leur le travail correspondant à leur spécialité :

- **frontend-dev** — implémentation UI : composants React, hooks, pages, Tailwind
- **backend-dev** — implémentation serveur : routes API, intégration Ollama, MongoDB
- **designer** — specs de design (layouts, thème, états, accessibilité) avant implémentation
- **code-reviewer** — relecture du code après toute modification significative
- **test-reviewer** — qualité et couverture des tests après ajout de code ou de tests
- **ci-reviewer** — audit et amélioration des workflows GitHub Actions (`.github/workflows`)
- **docker-dev** — conteneurisation : Dockerfile, docker-compose, .dockerignore, env Docker, scripts de stack

Workflow type pour une fonctionnalité : `designer` (si UI) → `frontend-dev` / `backend-dev` → `code-reviewer` + `test-reviewer`. Pour la CI/CD : `ci-reviewer`. Pour le build/déploiement conteneurisé : `docker-dev`.
