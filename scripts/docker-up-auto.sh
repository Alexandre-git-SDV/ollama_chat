#!/usr/bin/env bash
set -euo pipefail

# Auto-select host services when available; start missing containers otherwise.

has_ollama=false
has_mongo=false

if command -v curl >/dev/null 2>&1; then
  if curl -fsS --max-time 1 http://localhost:11434/api/version >/dev/null 2>&1; then
    has_ollama=true
  fi
fi

if command -v nc >/dev/null 2>&1; then
  if nc -z localhost 27017 >/dev/null 2>&1; then
    has_mongo=true
  fi
elif command -v timeout >/dev/null 2>&1; then
  if timeout 1 bash -c '</dev/tcp/localhost/27017' >/dev/null 2>&1; then
    has_mongo=true
  fi
fi

services=(app)

if [[ "$has_ollama" == true ]]; then
  ollama_base_url="http://host.docker.internal:11434"
  echo "Ollama detecte sur l'hote: utilisation du service local"
else
  ollama_base_url="http://ollama:11434"
  services+=(ollama)
  echo "Ollama non detecte: lancement du conteneur ollama"
fi

if [[ "$has_mongo" == true ]]; then
  mongodb_uri="mongodb://host.docker.internal:27017/ollama_chat"
  echo "MongoDB detecte sur l'hote: utilisation du service local"
else
  mongodb_uri="mongodb://mongo:27017/ollama_chat"
  services+=(mongo)
  echo "MongoDB non detecte: lancement du conteneur mongo"
fi

echo "Services demarres via Docker Compose: ${services[*]}"
OLLAMA_BASE_URL="$ollama_base_url" MONGODB_URI="$mongodb_uri" docker compose up -d "${services[@]}"
