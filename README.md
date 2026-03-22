# Ollama Chat

Interface web pour discuter avec des modèles Ollama en local, avec stockage des conversations sur MongoDB.

## Stack

- **Frontend** : Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript
- **Backend** : Next.js API Routes
- **IA** : [Ollama](https://ollama.com) — modèles locaux (Llama, Mistral, etc.)
- **Base de données** : MongoDB (mongoose)
- **Tests** : Vitest + Testing Library
- **Conteneurisation** : Docker, Docker Compose

## Démarrage rapide

### Prérequis

- Node.js 22+
- Docker & Docker Compose
- Ollama installé localement (`ollama serve`)

### Développement local (sans Docker)

```bash
# 1. Cloner et installer
pnpm install

# 2. Configurer les variables d'environnement
cp .env.docker .env.local
# Modifier MONGODB_URI si nécessaire

# 3. Lancer Ollama (dans un terminal séparé)
ollama serve
ollama pull llama3.2

# 4. Lancer le serveur de dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Avec Docker Compose (recommandé)

```bash
# Tout lancer (app + Ollama + MongoDB)
docker compose up -d

# Avec l'admin MongoDB Express
docker compose --profile admin up -d
```

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| Ollama API | http://localhost:11434 |
| MongoDB | mongodb://localhost:27017 |
| MongoDB Express | http://localhost:8081 |

## Scripts

```bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Démarrer production
npm run lint         # ESLint
npm run test         # Tests (Vitest)
npm run test:watch  # Tests en watch mode
npm run test:coverage # Couverture de code
```

## API Routes

### Ollama
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
| POST | `/api/chat` | Chat streaming SSE |
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

| Variable | Description | Défaut |
|----------|-------------|--------|
| `OLLAMA_BASE_URL` | URL de l'API Ollama | `http://localhost:11434` |
| `DEFAULT_MODEL` | Modèle par défaut | `llama3.2` |
| `MONGODB_URI` | Connection string MongoDB | — |

## Tests

```bash
npm run test          # Lancer les tests
npm run test:coverage # Rapport de couverture
```

Couverture actuelle : **19 tests**, composants UI et types validés.

## CI/CD

Le pipeline GitHub Actions (`Ollama CI`) s'exécute sur chaque push et pull request sur `master` et `development` :

1. **Lint** — ESLint
2. **Test** — Vitest + couverture
3. **Build Docker** — Image GHCR (push sur `master` uniquement)
4. **Build Next.js** — Build de production

## Licence

MIT