FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

# Install dependencies for shared and api only (avoid pulling web packages)
COPY packages/shared/package*.json packages/shared/
COPY api/package*.json api/
# lockfile for consistency
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY pnpm-workspace.yaml pnpm-workspace.yaml
# install all workspace dependencies without running prepare scripts yet
RUN pnpm install --ignore-scripts --prod=false

# Copy sources (including tsconfig)
COPY packages/shared packages/shared
COPY api api

# Build shared then api
RUN cd packages/shared && pnpm run build
RUN cd api && pnpm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy only the api artifacts
COPY --from=builder /app/api/node_modules ./node_modules
COPY --from=builder /app/api/dist ./dist
COPY api/start.sh /start.sh
RUN chmod +x /start.sh
ENTRYPOINT ["/start.sh"]
CMD ["node", "dist/main.js"]
