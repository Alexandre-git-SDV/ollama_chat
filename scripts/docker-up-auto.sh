#!/usr/bin/env bash
set -euo pipefail

# Auto-select host services when available; start missing containers otherwise.

has_ollama=false
has_mongo=false
ollama_reachable_from_container=true

runtime_env_file=".env.docker.runtime"

# Keep detection fully independent from shell-exported env vars.
explicit_ollama_url=""
explicit_mongo_uri=""

if [[ ! -f ".env.docker" ]]; then
  echo "Fichier .env.docker introuvable"
  exit 1
fi

# Build an isolated env source for compose from docker-only files.
cp .env.docker "$runtime_env_file"
if [[ -f ".env.docker.local" ]]; then
  cat .env.docker.local >> "$runtime_env_file"
fi

if [[ -z "$explicit_ollama_url" ]]; then
  if command -v curl >/dev/null 2>&1; then
    if curl -fsS --max-time 1 http://localhost:11434/api/version >/dev/null 2>&1; then
      has_ollama=true
    fi
  fi
else
  has_ollama=true
fi

if [[ -z "$explicit_mongo_uri" ]]; then
  if command -v nc >/dev/null 2>&1; then
    if nc -z localhost 27017 >/dev/null 2>&1; then
      has_mongo=true
    fi
  elif command -v timeout >/dev/null 2>&1; then
    if timeout 1 bash -c '</dev/tcp/localhost/27017' >/dev/null 2>&1; then
      has_mongo=true
    fi
  fi
else
  has_mongo=true
fi

services=(app)

if [[ "$has_ollama" == true && -z "$explicit_ollama_url" && $(command -v ss >/dev/null 2>&1; echo $?) -eq 0 ]]; then
  # Containers cannot reach host services that only listen on loopback.
  if ss -ltn | awk '{print $4}' | grep -Eq '(^|:)127\.0\.0\.1:11434$|(^|:)\[::1\]:11434$'; then
    if ! ss -ltn | awk '{print $4}' | grep -Eq '(^|:)0\.0\.0\.0:11434$|(^|:)\[::\]:11434$'; then
      ollama_reachable_from_container=false
    fi
  fi
fi

if [[ -n "$explicit_ollama_url" ]]; then
  ollama_base_url="$explicit_ollama_url"
  echo "OLLAMA_BASE_URL force: $ollama_base_url"
elif [[ "$has_ollama" == true && "$ollama_reachable_from_container" == true ]]; then
  ollama_base_url="http://host.docker.internal:11434"
  echo "Ollama detecte sur l'hote et accessible depuis le conteneur"
else
  ollama_base_url="http://ollama:11434"
  services+=(ollama)
  if [[ "$has_ollama" == true ]]; then
    echo "Ollama local detecte mais non accessible depuis Docker (bind loopback)."
    echo "Lancement du conteneur ollama."
    echo "Pour utiliser l'Ollama host, lance-le avec OLLAMA_HOST=0.0.0.0"
  else
    echo "Ollama non detecte: lancement du conteneur ollama"
  fi
fi

if [[ -n "$explicit_mongo_uri" ]]; then
  mongodb_uri="$explicit_mongo_uri"
  echo "MONGODB_URI force: $mongodb_uri"
elif [[ "$has_mongo" == true ]]; then
  mongodb_uri="mongodb://host.docker.internal:27017/ollama_chat"
  echo "MongoDB detecte sur l'hote: utilisation du service local"
else
  mongodb_uri="mongodb://mongo:27017/ollama_chat"
  services+=(mongo)
  echo "MongoDB non detecte: lancement du conteneur mongo"
fi

echo "Services demarres via Docker Compose: ${services[*]}"
cp "$runtime_env_file" "$runtime_env_file.tmp"
{
  echo ""
  echo "OLLAMA_BASE_URL=$ollama_base_url"
  echo "MONGODB_URI=$mongodb_uri"
} >> "$runtime_env_file.tmp"
mv "$runtime_env_file.tmp" "$runtime_env_file"

docker compose --env-file "$runtime_env_file" up -d "${services[@]}"
