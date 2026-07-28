@AGENTS.md

# Spécifique Claude Code

## Politique de modèles (économie de ressources)

Les modèles des sous-agents sont fixés dans le frontmatter de `.claude/agents/*.md` :

- **haiku** — tâches légères et mécaniques : `test-reviewer`
- **sonnet** — analyse et rédaction : `code-reviewer`, `designer`, `ci-reviewer`, `docker-dev`
- **opus** — écriture de code : `frontend-dev`, `backend-dev`

Applique la même logique en dehors des sous-agents : les commandes simples (lint, tests, git, exploration de fichiers) ne justifient pas de raisonnement lourd ; réserve l'effort au code de production. Ne change pas ces modèles sans demande explicite de l'utilisateur.
