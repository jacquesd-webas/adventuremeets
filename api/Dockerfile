FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

# Install API dependencies using workspace lockfile
COPY api/package.json api/pnpm-lock.yaml ./api/
RUN cd api && pnpm install --ignore-scripts --prod=false --no-frozen-lockfile

# Copy sources (including tsconfig)
COPY api api

# Build api
RUN cd api && pnpm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy only the api artifacts
COPY --from=builder /app/api/node_modules ./node_modules
COPY --from=builder /app/api/dist ./dist
COPY api/package.json ./package.json
COPY api/start.sh /start.sh
RUN chmod +x /start.sh
ENTRYPOINT ["/start.sh"]
CMD ["node", "dist/main.js"]
