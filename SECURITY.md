[🇬🇧 English](#-english) | [🇫🇷 Français](#-français)

---

## 🇬🇧 English

# Security Policy

## Supported versions

Ollama Chat is a single-line, actively developed project (pre-1.0, no published releases or version tags). Only the latest commit on the [`master`](https://github.com/Alexandre-git-SDV/Ollama_chat/tree/master) branch is supported with security fixes.

| Version | Supported |
|---------|-----------|
| `master` (latest) | ✅ |
| `development` and other branches | ⚠️ Best effort only |
| Older commits / forks | ❌ |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report it privately using one of these channels:

- **Preferred**: [GitHub Security Advisories](https://github.com/Alexandre-git-SDV/Ollama_chat/security/advisories/new) — private disclosure directly on this repository.
- Alternatively, open a regular [issue](https://github.com/Alexandre-git-SDV/Ollama_chat/issues) without sensitive details and ask to be contacted privately.

When reporting, please include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce (proof of concept if possible).
- The affected file(s)/route(s) and commit hash.

This is a small, independently maintained project — response times are best-effort. You should expect an initial acknowledgement within a few days. Confirmed vulnerabilities will be fixed and disclosed once a patch is available; credit will be given unless you prefer to remain anonymous.

## Scope and known limitations

Ollama Chat is designed to run **locally or on a trusted network**, in front of a local Ollama instance and a MongoDB database:

- The application ships **without built-in authentication**. Do not expose it directly to the public internet without adding your own reverse proxy authentication, VPN, or network-level access control.
- External AI provider API keys (Claude, GPT, Mistral, Gemini, etc.), when configured in the Settings modal, are stored **client-side only** (browser storage) and are never persisted server-side or in MongoDB.
- Dependency and container vulnerabilities are continuously monitored via CodeQL, Dependency Review, and Trivy in [CI](https://github.com/Alexandre-git-SDV/Ollama_chat/actions) — see `README.md` for details.

---

## 🇫🇷 Français

# Politique de sécurité

## Versions supportées

Ollama Chat est un projet à ligne unique, activement développé (pré-1.0, sans releases ni tags de version publiés). Seul le dernier commit de la branche [`master`](https://github.com/Alexandre-git-SDV/Ollama_chat/tree/master) bénéficie de correctifs de sécurité.

| Version | Supportée |
|---------|-----------|
| `master` (dernière version) | ✅ |
| `development` et autres branches | ⚠️ Best effort uniquement |
| Anciens commits / forks | ❌ |

## Signaler une vulnérabilité

Merci de **ne pas** ouvrir d'issue GitHub publique pour signaler une vulnérabilité de sécurité.

Utilise plutôt l'un de ces canaux privés :

- **Recommandé** : [GitHub Security Advisories](https://github.com/Alexandre-git-SDV/Ollama_chat/security/advisories/new) — signalement privé directement sur ce dépôt.
- Sinon, ouvre une [issue](https://github.com/Alexandre-git-SDV/Ollama_chat/issues) classique sans détail sensible en demandant à être recontacté en privé.

Merci d'inclure dans le signalement :

- Une description de la vulnérabilité et de son impact potentiel.
- Les étapes de reproduction (preuve de concept si possible).
- Le(s) fichier(s)/route(s) concerné(s) et le hash du commit.

Il s'agit d'un petit projet maintenu de façon indépendante — les délais de réponse sont donnés à titre indicatif (best effort). Un premier accusé de réception est à prévoir sous quelques jours. Les vulnérabilités confirmées seront corrigées puis divulguées une fois un correctif disponible ; les crédits seront donnés sauf demande d'anonymat de ta part.

## Périmètre et limites connues

Ollama Chat est conçu pour fonctionner **en local ou sur un réseau de confiance**, devant une instance Ollama locale et une base MongoDB :

- L'application est livrée **sans authentification intégrée**. Ne l'expose pas directement sur Internet sans ajouter ta propre authentification via reverse proxy, un VPN, ou un contrôle d'accès réseau.
- Les clés API des fournisseurs IA externes (Claude, GPT, Mistral, Gemini, etc.), lorsqu'elles sont configurées dans la modale Paramètres, sont stockées **uniquement côté client** (stockage du navigateur) et ne sont jamais persistées côté serveur ni dans MongoDB.
- Les vulnérabilités des dépendances et des conteneurs sont surveillées en continu via CodeQL, Dependency Review et Trivy dans la [CI](https://github.com/Alexandre-git-SDV/Ollama_chat/actions) — voir `README.md` pour le détail.

---

## Patches

`pnpm` applies one patched dependency on every install, declared in `package.json` (`pnpm.patchedDependencies`) and stored at [`patches/minimatch@3.1.5.patch`](patches/minimatch%403.1.5.patch):

- **Why**: `eslint-config-next`'s legacy lint plugins (`eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`) depend on `minimatch@3.1.5`, an unmaintained major version that never received a fix for [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) (`brace-expansion` DoS via unbounded expansion length). Per the advisory, only `brace-expansion@5.0.8+` is patched — the 1.x and 2.x branches have no fixed release at all.
- **What it does**: forces `minimatch@3.1.5` to use `brace-expansion@5.0.8` (via a `pnpm.overrides` entry) and patches the one line in `minimatch.js` that assumed the old callable-function export (`require('brace-expansion')`) to use the new named export instead (`require('brace-expansion').expand`), since `brace-expansion@5.x` changed its module shape. Functionally verified: `pnpm lint`, `pnpm test`, and `pnpm build` all pass with the patch applied, and `pnpm audit` reports zero known vulnerabilities.
- **Scope**: `minimatch` here is only used by ESLint tooling at lint/build time — never bundled into the production Docker image or executed against untrusted input.
- **Removal**: this patch (and the related `pnpm.overrides` entries) can be dropped once `eslint-config-next`'s plugin dependencies upgrade past `minimatch@3.x`.

## Correctifs appliqués

`pnpm` applique un correctif de dépendance à chaque installation, déclaré dans `package.json` (`pnpm.patchedDependencies`) et stocké dans [`patches/minimatch@3.1.5.patch`](patches/minimatch%403.1.5.patch) :

- **Pourquoi** : les plugins de lint historiques d'`eslint-config-next` (`eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`) dépendent de `minimatch@3.1.5`, une version majeure non maintenue qui n'a jamais reçu de correctif pour [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) (DoS `brace-expansion` par expansion non bornée). D'après l'avis officiel, seule la branche `brace-expansion@5.0.8+` est corrigée — les branches 1.x et 2.x n'ont aucune version corrigée publiée.
- **Ce qu'il fait** : force `minimatch@3.1.5` à utiliser `brace-expansion@5.0.8` (via une entrée `pnpm.overrides`) et corrige la ligne de `minimatch.js` qui supposait l'ancien export sous forme de fonction directe (`require('brace-expansion')`) pour utiliser le nouvel export nommé (`require('brace-expansion').expand`), `brace-expansion@5.x` ayant changé la forme de son module. Vérifié fonctionnellement : `pnpm lint`, `pnpm test` et `pnpm build` passent tous avec le correctif appliqué, et `pnpm audit` ne remonte plus aucune vulnérabilité connue.
- **Périmètre** : `minimatch` n'est utilisé ici que par l'outillage ESLint au moment du lint/build — jamais embarqué dans l'image Docker de production ni exécuté sur une entrée non fiable.
- **Suppression** : ce correctif (et les entrées `pnpm.overrides` associées) pourra être retiré une fois que les dépendances des plugins d'`eslint-config-next` seront mises à jour au-delà de `minimatch@3.x`.
