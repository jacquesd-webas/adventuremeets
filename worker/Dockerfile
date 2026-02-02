FROM node:20-alpine

WORKDIR /app/worker

RUN apk add --no-cache tini
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
COPY api/package.json api/pnpm-lock.yaml ./api/
COPY worker/package.json worker/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build worker
COPY api/tsconfig*.json ./api/
COPY api/src ./api/src
COPY worker/tsconfig.json ./tsconfig.json
COPY worker/src ./src
RUN pnpm run build

COPY worker/start.sh /start.sh
RUN chmod +x /start.sh

ENTRYPOINT ["/sbin/tini","--"]
CMD ["/start.sh"]
