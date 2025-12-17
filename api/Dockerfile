FROM node:20-alpine AS builder
WORKDIR /app

COPY packages/shared packages/shared

WORKDIR /app/packages/shared
RUN npm install
RUN npm run build

WORKDIR /app/api
COPY api api
RUN npm install
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/api/node_modules ./node_modules
COPY --from=builder /app/api/dist ./dist
CMD ["node", "dist/main.js"]
