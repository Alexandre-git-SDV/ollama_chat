FROM node:24-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# pnpm@10 aligné sur le champ "packageManager" de package.json (utilisé aussi
# par la CI via pnpm/action-setup) : pnpm@11 durcit le contrôle des
# scripts de build en erreur bloquante non interactive (esbuild/sharp/...).
RUN corepack enable pnpm && corepack prepare pnpm@10 --activate
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

FROM base AS builder
RUN corepack enable pnpm && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV OLLAMA_BASE_URL=http://localhost:11434
ENV DEFAULT_MODEL=llama3.2
ENV MONGODB_URI=mongodb://localhost:27017/ollama_chat

RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# npm/npx/corepack ne sont jamais utilisés au runtime (CMD lance node
# directement) : on les retire pour réduire la surface d'attaque et éliminer
# les CVE de leurs dépendances embarquées (ex. tar fourni avec npm).
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV OLLAMA_HOST=http://ollama:11434
ENV OLLAMA_BASE_URL=http://ollama:11434

# Vérifie uniquement que le serveur Next répond ; ne dépend pas d'Ollama ou de
# MongoDB (voir /api/ollama/health qui renvoie 503 quand Ollama est down).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
