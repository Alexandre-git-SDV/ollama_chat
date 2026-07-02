# Ollama Chat

Interface web pour discuter avec des modèles Ollama en local, avec stockage des conversations sur MongoDB.

## Fonctionnalités

- 💬 **Chat en streaming** (NDJSON) avec indicateur de réflexion, curseur de frappe et bouton stop
- 🗂️ **Conversations persistées** — localStorage + MongoDB, titres générés automatiquement, renommage, export **JSON / Markdown**
- 🎨 **Design system sombre/clair** — couleur d'accent configurable (7 teintes persistées), dégradé signature, LED de statut
- ⚙️ **Modale Paramètres** — sélection de modèle (taille, statut chargé), system prompt, température, sources externes (Claude, GPT, Mistral, Gemini… clés stockées uniquement en local)
- 🔌 **Proxy Ollama intégré** — plus aucun problème de CORS : le front passe par `/api/ollama/*`
- 📱 **Responsive** — sidebar en drawer sur mobile, cibles tactiles ≥ 44 px, navigation clavier et ARIA complets

## Stack

- **Frontend** : Next.js 16 (App Router), React 19 (React Compiler), Tailwind CSS v4, TypeScript
- **Backend** : Next.js Route Handlers (proxy Ollama, CRUD conversations)
- **IA** : [Ollama](https://ollama.com) — modèles locaux (Llama, Mistral, etc.)
- **Base de données** : MongoDB (Mongoose 9)
- **Tests** : Vitest + Testing Library (jsdom)
- **Conteneurisation** : Docker multi-stage (pnpm/corepack), Docker Compose
- **Gestionnaire de paquets** : **pnpm** (pinné via `packageManager`, jamais npm/yarn)

## Démarrage rapide

### Prérequis

- Node.js 22+ et **pnpm 10** (`corepack enable pnpm`)
- Docker & Docker Compose (pour la stack conteneurisée)
- Ollama installé localement (`ollama serve`)

### Développement local (sans Docker)

```bash
# 1. Cloner et installer
pnpm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Modifier MONGODB_URI si nécessaire

# 3. Lancer Ollama (dans un terminal séparé)
ollama serve
ollama pull llama3.2

# 4. Lancer le serveur de dev
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Avec Docker Compose (recommandé)

```bash
# Démarrage intelligent :
# - utilise Ollama/Mongo de la machine si détectés et accessibles
# - démarre seulement les conteneurs manquants
pnpm docker:up:auto

# Arrêt
docker compose down

# Avec l'admin MongoDB Express (optionnel)
docker compose --profile admin up -d mongo-express
```

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| Ollama API | http://localhost:11434 |
| MongoDB | mongodb://localhost:27017 |
| MongoDB Express | http://localhost:8081 |

## Scripts

```bash
pnpm dev            # Développement
pnpm build          # Build production
pnpm start          # Démarrer production
pnpm lint           # ESLint
pnpm test           # Tests (Vitest)
pnpm test:watch     # Tests en watch mode
pnpm test:coverage  # Couverture de code
pnpm docker:up:auto # Stack Docker complète
```

## API Routes

### Proxy Ollama (point d'accès principal du front)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/ollama/[...path]` | Proxy vers l'API Ollama (`OLLAMA_HOST`) — supprime le CORS, préserve le streaming. Ex. : `/api/ollama/api/tags`, `/api/ollama/api/chat` |

### Routes Ollama granulaires

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/ollama/health` | Connectivité Ollama |
| GET | `/api/ollama/version` | Version Ollama |
| GET | `/api/ollama/tags` | Modèles installés |
| GET | `/api/ollama/ps` | Modèles en mémoire |
| POST | `/api/ollama/show` | Détails d'un modèle |
| POST | `/api/ollama/load` | Charger un modèle |
| POST | `/api/ollama/unload` | Décharger un modèle |

### Chat

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/chat` | Chat streaming SSE (legacy — le front utilise le proxy NDJSON) |
| POST | `/api/chat/title` | Générer un titre |

### Conversations (MongoDB)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/conversations` | Liste des conversations |
| POST | `/api/conversations` | Créer une conversation |
| GET | `/api/conversations/[id]` | Récupérer une conversation |
| PUT | `/api/conversations/[id]` | Mettre à jour |
| DELETE | `/api/conversations/[id]` | Supprimer |
| POST | `/api/conversations/[id]/save` | Ajouter des messages |

## Variables d'environnement

Les variables Docker sont isolées des variables Next.js locales :

- `.env.docker` : valeurs Docker non sensibles (versionnables)
- `.env.docker.local` : secrets Docker locaux (non versionné)
- `.env.docker.runtime` : généré automatiquement par `scripts/docker-up-auto.sh` (non versionné)

Préparation conseillée :

```bash
cp .env.docker.local.example .env.docker.local
# puis éditer .env.docker.local avec tes valeurs privées
```

Pour que le conteneur puisse joindre Ollama installé sur l'hôte Linux,
Ollama doit écouter sur `0.0.0.0` (pas seulement `127.0.0.1`) :

```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Vérification :

```bash
ss -ltn | grep 11434
```

Tu dois voir `0.0.0.0:11434` ou `[::]:11434`.

| Variable | Description | Défaut |
|----------|-------------|--------|
| `OLLAMA_HOST` | Cible du proxy `/api/ollama/[...path]` | `http://127.0.0.1:11434` (`http://ollama:11434` en compose) |
| `OLLAMA_BASE_URL` | URL Ollama des routes granulaires | `http://localhost:11434` |
| `DEFAULT_MODEL` | Modèle par défaut | `llama3.2` |
| `MONGODB_URI` | Connection string MongoDB | — |

> ⚠️ Utiliser `127.0.0.1` plutôt que `localhost` pour `OLLAMA_HOST` hors Docker (évite les échecs de résolution IPv6).

## Tests

```bash
pnpm test           # Lancer les tests
pnpm test:coverage  # Rapport de couverture
```

Couverture actuelle : **25 tests** — composants UI (sidebar, messages, streaming, thème, export, suppression) et types validés.

## CI/CD

Workflows GitHub Actions, sur push et pull request vers `master` et `development` :

- **Ollama CI** — lint → tests + couverture → typecheck (`tsc --noEmit`) → build Next.js → image Docker publiée sur GHCR (push sur `master` uniquement). Tous les jobs Node utilisent pnpm avec cache.
- **CodeQL** — analyse de sécurité JavaScript/TypeScript (+ hebdomadaire, lundi)
- **Dependency Review** — revue des dépendances sur les PR (échec sur vulnérabilité high+)
- **Docker Security Scan** — build de l'image + scan Trivy (SARIF vers l'onglet Security, gate bloquante sur les CVE critiques corrigées, + scan des dépendances ; hebdomadaire, mercredi)

## Développement assisté par agents

Le projet est configuré pour Claude Code et opencode :

- **MCP `next-devtools`** (`.mcp.json` / `opencode.json`) — erreurs, routes et logs de l'app en temps réel pendant `pnpm dev`
- **7 sous-agents spécialisés** (`.claude/agents/`, `.opencode/agent/`) — `designer` (design system officiel intégré), `frontend-dev`, `backend-dev`, `code-reviewer`, `test-reviewer`, `ci-reviewer`, `docker-dev`

Voir `AGENTS.md` pour les conventions du projet.

## Licence

MIT
