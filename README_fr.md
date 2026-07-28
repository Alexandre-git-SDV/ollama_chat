🇬🇧 [English](README.md) | 🇫🇷 Français

# Ollama Chat

Interface web locale pour discuter avec des modèles Ollama, avec stockage des conversations dans MongoDB.

## Fonctionnalités

- 💬 **Chat en streaming** (NDJSON) avec indicateur de réflexion, curseur de frappe et bouton d'arrêt
- 🗂️ **Conversations persistées** — localStorage + MongoDB, titres générés automatiquement, renommage, export **JSON / Markdown**
- 🎨 **Design system sombre/clair** — couleur d'accent configurable (7 teintes persistées), dégradé signature, LED de statut
- ⚙️ **Modale Paramètres** — sélection du modèle (taille, statut chargé), system prompt, température, sources externes (Claude, GPT, Mistral, Gemini… clés API stockées uniquement en local)
- 🔌 **Proxy Ollama intégré** — plus aucun problème de CORS : le frontend passe par `/api/ollama/*`
- 📱 **Responsive** — sidebar en tiroir sur mobile, cibles tactiles ≥ 44 px, navigation clavier et support ARIA complets

## Stack technique

- **Frontend** : Next.js 16 (App Router), React 19 (React Compiler), Tailwind CSS v4, TypeScript
- **Backend** : Next.js Route Handlers (proxy Ollama, CRUD des conversations)
- **IA** : [Ollama](https://ollama.com) — modèles locaux (Llama, Mistral, etc.)
- **Base de données** : MongoDB (Mongoose 9)
- **Tests** : Vitest + Testing Library (jsdom)
- **Conteneurisation** : Docker multi-stage (pnpm/corepack), Docker Compose
- **Gestionnaire de paquets** : **pnpm** (épinglé via `packageManager`, jamais npm/yarn)

## Démarrage rapide

### Prérequis

- Node.js 24+ et **pnpm 10** (`corepack enable pnpm`)
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

# 4. Lancer le serveur de développement
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Avec Docker Compose (recommandé)

```bash
# Démarrage intelligent :
# - réutilise Ollama/Mongo de la machine hôte si détectés et accessibles
# - démarre uniquement les conteneurs manquants
pnpm docker:up:auto

# Arrêt
docker compose down

# Avec l'interface d'administration MongoDB Express (optionnel)
docker compose --profile admin up -d mongo-express
```

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| API Ollama | http://localhost:11434 |
| MongoDB | mongodb://localhost:27017 |
| MongoDB Express | http://localhost:8081 |

## Scripts

```bash
pnpm dev            # Développement
pnpm build          # Build de production
pnpm start          # Démarrer le serveur de production
pnpm lint           # ESLint
pnpm test           # Tests (Vitest)
pnpm test:watch     # Tests en mode watch
pnpm test:coverage  # Couverture de code
pnpm docker:up:auto # Stack Docker complète
```

## Routes API

### Proxy Ollama (point d'entrée principal utilisé par le frontend)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET/POST | `/api/ollama/[...path]` | Proxy vers l'API Ollama (`OLLAMA_HOST`) — supprime les problèmes de CORS, préserve le streaming. Ex. : `/api/ollama/api/tags`, `/api/ollama/api/chat` |

### Routes Ollama granulaires

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/ollama/health` | Connectivité Ollama |
| GET | `/api/ollama/version` | Version d'Ollama |
| GET | `/api/ollama/tags` | Modèles installés |
| GET | `/api/ollama/ps` | Modèles actuellement chargés en mémoire |
| POST | `/api/ollama/show` | Détails d'un modèle |
| POST | `/api/ollama/load` | Charger un modèle |
| POST | `/api/ollama/unload` | Décharger un modèle |

### Chat

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/chat` | Chat en streaming SSE (legacy — le frontend utilise le proxy NDJSON) |
| POST | `/api/chat/title` | Générer un titre |

### Conversations (MongoDB)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/conversations` | Lister les conversations |
| POST | `/api/conversations` | Créer une conversation |
| GET | `/api/conversations/[id]` | Récupérer une conversation |
| PUT | `/api/conversations/[id]` | Mettre à jour une conversation |
| DELETE | `/api/conversations/[id]` | Supprimer une conversation |
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

Pour que le conteneur puisse joindre une instance Ollama installée sur l'hôte Linux,
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
| `OLLAMA_HOST` | Cible du proxy `/api/ollama/[...path]` | `http://127.0.0.1:11434` (`http://ollama:11434` en Compose) |
| `OLLAMA_BASE_URL` | URL Ollama utilisée par les routes granulaires | `http://localhost:11434` |
| `DEFAULT_MODEL` | Modèle par défaut | `llama3.2` |
| `MONGODB_URI` | Chaîne de connexion MongoDB | — |

> ⚠️ Utiliser `127.0.0.1` plutôt que `localhost` pour `OLLAMA_HOST` hors Docker (évite les échecs de résolution IPv6).

## Tests

```bash
pnpm test           # Lancer les tests
pnpm test:coverage  # Rapport de couverture
```

Couverture actuelle : **36 tests** — composants UI (sidebar, messages, streaming, thème, export, suppression) et validation des types.

## CI/CD

Workflows GitHub Actions, exécutés sur push et pull request vers `master` et `development` :

- **Ollama CI** — lint → tests + couverture → typecheck (`tsc --noEmit`) → build Next.js → image Docker publiée sur GHCR (push sur `master` uniquement). Tous les jobs Node utilisent pnpm avec cache.
- **CodeQL** — analyse de sécurité JavaScript/TypeScript (+ exécution hebdomadaire le lundi)
- **Dependency Review** — revue des dépendances sur les pull requests (échoue sur les vulnérabilités de sévérité élevée ou critique)
- **Docker Security Scan** — build de l'image + scan Trivy (SARIF envoyé vers l'onglet Security, gate bloquante sur les CVE critiques corrigées, ainsi qu'un scan des dépendances du dépôt ; hebdomadaire le mercredi)

## Développement assisté par agents

Le projet est configuré pour Claude Code et opencode :

- **MCP `next-devtools`** (`.mcp.json` / `opencode.json`) — erreurs, routes et logs de l'application en temps réel pendant `pnpm dev`
- **7 sous-agents spécialisés** (`.claude/agents/`, `.opencode/agent/`) — `designer` (design system officiel intégré), `frontend-dev`, `backend-dev`, `code-reviewer`, `test-reviewer`, `ci-reviewer`, `docker-dev`

Voir `AGENTS.md` pour les conventions du projet.

## Sécurité

Voir [SECURITY.md](SECURITY.md) pour les versions supportées et la procédure de signalement de vulnérabilités.

## Licence

MIT
