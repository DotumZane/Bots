FROM node:22-bookworm-slim AS base
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci
RUN npx playwright install --with-deps chromium

FROM deps AS build
COPY . .
ENV DATABASE_URL=file:/tmp/build.db
RUN npx prisma generate && npm run build

FROM base AS runtime
ENV NODE_ENV=production PORT=3847 DATA_DIR=/data DATABASE_URL=file:/data/bots.db BOTS_ENCRYPTION_KEY_FILE=/data/encryption.key PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --chown=node:node --from=deps /ms-playwright /ms-playwright
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/.next ./.next
COPY --chown=node:node --from=build /app/public ./public
COPY --chown=node:node --from=build /app/prisma ./prisma
COPY --chown=node:node --from=build /app/worker ./worker
COPY --chown=node:node --from=build /app/lib ./lib
COPY --chown=node:node --chmod=755 --from=build /app/package*.json /app/tsconfig.json /app/scripts/start.sh ./
RUN mkdir -p /data/cache /data/logs && chown -R node:node /data
EXPOSE 3847
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3847/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["/app/start.sh"]
